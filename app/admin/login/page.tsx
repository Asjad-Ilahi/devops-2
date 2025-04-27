"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Color from "color"
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Interface for Colors
interface Colors {
  primaryColor: string
  secondaryColor: string
}

// Interface for API response
interface LoginResponse {
  success: boolean
  token?: string
  requiresTwoFactor?: boolean
  error?: string
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showTwoFactor, setShowTwoFactor] = useState<boolean>(false)
  const [twoFactorCode, setTwoFactorCode] = useState<string>("")
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [colors, setColors] = useState<Colors | null>(null)
  const [settings, setSettings] = useState<any>(null)

  // Fetch colors and settings
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("/api/colors")
        if (!response.ok) throw new Error("Failed to fetch colors")
        const data: Colors = await response.json()
        setColors(data)

        const primary = Color(data.primaryColor)
        const secondary = Color(data.secondaryColor)

        const generateShades = (color: typeof Color.prototype) => ({
          50: color.lighten(0.5).hex(),
          100: color.lighten(0.4).hex(),
          200: color.lighten(0.3).hex(),
          300: color.lighten(0.2).hex(),
          400: color.lighten(0.1).hex(),
          500: color.hex(),
          600: color.darken(0.1).hex(),
          700: color.darken(0.2).hex(),
          800: color.darken(0.3).hex(),
          900: color.darken(0.4).hex(),
        })

        const primaryShades = generateShades(primary)
        const secondaryShades = generateShades(secondary)

        Object.entries(primaryShades).forEach(([shade, color]) => {
          document.documentElement.style.setProperty(`--primary-${shade}`, color)
        })

        Object.entries(secondaryShades).forEach(([shade, color]) => {
          document.documentElement.style.setProperty(`--secondary-${shade}`, color)
        })
      } catch (error) {
        console.error("Error fetching colors:", error)
      }
    }

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          setSettings(null)
        }
      } catch (error) {
        setSettings(null)
      }
    }

    fetchColors()
    fetchSettings()
  }, [])

  // Check authentication token and handle hydration
  useEffect(() => {
    setIsMounted(true)
    const checkAuth = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("adminToken="))
          ?.split("=")[1]
        if (token) {
          router.push("/admin/dashboard")
        }
      } catch (error) {
        console.error("Auth check error:", error)
      }
    }
    checkAuth()
  }, [router])

  // Handle login submission
  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!username.trim() || !password.trim()) {
        setError("Please enter both username and password")
        return
      }

      setError(null)
      setIsLoading(true)

      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username: username.trim(), password: password.trim() }),
        })

        const data: LoginResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Login failed")
        }

        if (data.success && data.requiresTwoFactor) {
          setShowTwoFactor(true)
        } else if (data.success && data.token) {
          router.push("/admin/dashboard")
          router.refresh()
        } else {
          throw new Error("Invalid response from server")
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [username, password, router]
  )

  // Handle 2FA submission
  const handleTwoFactorSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!twoFactorCode.trim() || twoFactorCode.length !== 6) {
        setError("Please enter a valid 6-digit verification code")
        return
      }

      setError(null)
      setIsLoading(true)

      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username: username.trim(), twoFactorCode: twoFactorCode.trim() }),
        })

        const data: LoginResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Verification failed")
        }

        if (data.success && data.token) {
          router.push("/admin/dashboard")
          router.refresh()
        } else {
          throw new Error("Invalid response from server")
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [username, twoFactorCode, router]
  )

  // Prevent hydration mismatch
  if (!isMounted) {
    return null
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="flex items-center justify-center h-full px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Site Logo" className="h-10 w-auto" />
              ) : (
                <img src="/zelle-logo.svg" alt="Zelle" className="h-10 w-auto" />
              )}
              <span className="ml-2 text-gray-800 font-bold text-xl">Admin Portal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-900">Administrator Login</h1>
            <p className="mt-2 text-sm text-primary-600">Secure access for authorized bank administrators only</p>
          </div>

          <Card className="border-primary-100 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-primary-100 bg-primary-50/50">
              <CardTitle className="flex items-center text-xl text-primary-900">
                <ShieldAlert className="mr-2 h-5 w-5 text-primary-600" />
                Restricted Access
              </CardTitle>
              <CardDescription className="text-primary-600">
                This portal is for authorized bank administrators only.
              </CardDescription>
            </CardHeader>

            {error && (
              <Alert variant="destructive" className="mx-6 mt-6 bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <CardContent className="pt-6">
              {!showTwoFactor ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-primary-700">
                      Administrator ID
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your admin ID"
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      disabled={isLoading}
                      aria-describedby={error ? "username-error" : undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-primary-700">
                        Password
                      </Label>
                      <Link
                        href="/admin/forgot-password"
                        className="text-sm font-medium text-primary-600 hover:text-primary-800"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 pr-10"
                        disabled={isLoading}
                        aria-describedby={error ? "password-error" : undefined}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-500 hover:text-primary-700"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      "Sign in to Admin Portal"
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="twoFactorCode" className="text-primary-700">
                      Security Verification Code
                    </Label>
                    <p className="text-sm text-primary-600 mb-2">
                      We've sent a verification code to your registered device. Please enter it below.
                    </p>
                    <Input
                      id="twoFactorCode"
                      name="twoFactorCode"
                      type="text"
                      required
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 text-center text-lg tracking-widest"
                      maxLength={6}
                      disabled={isLoading}
                      aria-describedby={error ? "twoFactorCode-error" : undefined}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify and Continue"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-primary-600 hover:text-primary-800"
                    onClick={() => {
                      setShowTwoFactor(false)
                      setTwoFactorCode("")
                      setError(null)
                    }}
                    disabled={isLoading}
                  >
                    Back to login
                  </Button>
                </form>
              )}
            </CardContent>

            <CardFooter className="border-t border-primary-100 flex flex-col space-y-2 text-center text-xs text-primary-500">
              <p>This system is for authorized use only. All activities are logged and monitored.</p>
              <p>By accessing this system, you agree to comply with all bank security policies.</p>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-primary-600 hover:text-primary-800">
              Return to main site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}