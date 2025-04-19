"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false)
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoginLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, step: "requestCode" }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error)
        setIsLoginLoading(false)
        return
      }

      setShowTwoFactor(true)
      setIsLoginLoading(false)
    } catch (error) {
      setError("An error occurred. Please try again later.")
      setIsLoginLoading(false)
    }
  }

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsTwoFactorLoading(true)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, twoFactorCode, step: "verifyCode" }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error)
        setIsTwoFactorLoading(false)
        return
      }

      localStorage.setItem("token", data.token)
      router.push(data.redirect)
    } catch (error) {
      setError("An error occurred. Please try again later.")
      setIsTwoFactorLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-25"></div>
              <div className="relative bg-white p-2 rounded-full">
                <img src="/zelle-logo.svg" alt="Zelle" className="h-12 w-auto" />
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Register here
            </Link>
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur-sm opacity-30"></div>
          <div className="relative bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            {!showTwoFactor ? (
              <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-slate-700">
                      Username
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="mt-1 bg-slate-50 border-slate-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-slate-700">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pr-10 bg-slate-50 border-slate-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    By signing in, you agree to our{" "}
                    <Link href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleTwoFactorSubmit}>
                <div>
                  <Label htmlFor="twoFactorCode" className="text-slate-700">
                    Verification Code
                  </Label>
                  <p className="text-sm text-slate-600 mb-2">We've sent a code to your email. Please enter it below.</p>
                  <Input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    required
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="Enter verification code"
                    className="mt-1 text-center text-lg tracking-widest bg-slate-50 border-slate-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    maxLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                  disabled={isTwoFactorLoading}
                >
                  {isTwoFactorLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full text-indigo-600"
                  onClick={() => setShowTwoFactor(false)}
                >
                  Back to login
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-600">
            Bank Administrator?{" "}
            <Link href="/admin/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Access admin portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}