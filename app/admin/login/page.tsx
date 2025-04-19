"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [isMounted, setIsMounted] = useState(false) // Hydration fix from Code-02

  // Token check and hydration fix from Code-02
  useEffect(() => {
    setIsMounted(true)
    const checkAuth = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("adminToken="))
        ?.split("=")[1]
      if (token) {
        console.log("Token found, redirecting to dashboard")
        router.push("/admin/dashboard")
      }
    }
    checkAuth()
  }, [router])

  // Backend logic adapted from Code-02 for initial login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log("Attempting login with:", { username })
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      console.log("Response status:", response.status)
      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Assuming the API returns a flag for 2FA requirement
      if (data.success && data.requiresTwoFactor) {
        setShowTwoFactor(true) // Trigger 2FA step
      } else if (data.success && data.token) {
        console.log("Login successful, redirecting to dashboard")
        router.push("/admin/dashboard")
        router.refresh() // Ensure page refreshes to avoid hydration issues
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Backend logic adapted from Code-02 for 2FA verification
  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log("Verifying 2FA with code:", twoFactorCode)
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, twoFactorCode }), // Send username and 2FA code
      })

      console.log("2FA Response status:", response.status)
      const data = await response.json()
      console.log("2FA Response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      if (data.success && data.token) {
        console.log("2FA verification successful, redirecting to dashboard")
        router.push("/admin/dashboard")
        router.refresh() // Ensure page refreshes
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("2FA error:", error)
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="flex items-center justify-center h-full px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/zelle-logo.svg" alt="Zelle" className="h-10 w-auto" />
              <span className="ml-2 text-gray-800 font-bold text-xl">Admin Portal</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Administrator Login</h1>
            <p className="mt-2 text-sm text-gray-600">Secure access for authorized bank administrators only</p>
          </div>

          <Card className="border-indigo-100 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-indigo-100 bg-indigo-50/50">
              <CardTitle className="flex items-center text-xl text-indigo-900">
                <ShieldAlert className="mr-2 h-5 w-5 text-indigo-600" />
                Restricted Access
              </CardTitle>
              <CardDescription className="text-indigo-600">
                This portal is for authorized bank administrators only.
              </CardDescription>
            </CardHeader>

            {error && (
              <Alert variant="destructive" className="mx-6 mt-6 bg-red-50 border border-red-200">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <CardContent className="pt-6">
              {!showTwoFactor ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700">
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
                      className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-gray-700">
                        Password
                      </Label>
                      <Link
                        href="/admin/forgot-password"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
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
                        className="border-gray-300 pr-10"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
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
                    <Label htmlFor="twoFactorCode" className="text-gray-700">
                      Security Verification Code
                    </Label>
                    <p className="text-sm text-gray-600 mb-2">
                      We've sent a verification code to your registered device. Please enter it below.
                    </p>
                    <Input
                      id="twoFactorCode"
                      name="twoFactorCode"
                      type="text"
                      required
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="border-gray-300 text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                    className="w-full text-gray-600 hover:text-gray-800"
                    onClick={() => setShowTwoFactor(false)}
                  >
                    Back to login
                  </Button>
                </form>
              )}
            </CardContent>

            <CardFooter className="border-t border-gray-100 flex flex-col space-y-2 text-center text-xs text-gray-500">
              <p>This system is for authorized use only. All activities are logged and monitored.</p>
              <p>By accessing this system, you agree to comply with all bank security policies.</p>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
              Return to main site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}