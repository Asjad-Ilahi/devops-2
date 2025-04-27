"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [step, setStep] = useState(1) // 1: request code, 2: reset password
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleRequestCode = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage(data.message)
        setStep(2)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, newPassword }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage("Password has been reset successfully. You can now log in with your new password.")
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <Card className="w-full max-w-md border-primary-100 bg-white/60 backdrop-blur-sm shadow-lg">
        <CardHeader className="border-b border-primary-100 bg-primary-50/50">
          <CardTitle className="text-xl text-primary-900">Forgot Password</CardTitle>
          <CardDescription className="text-primary-600">Reset your admin password</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-primary-700">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="border-primary-200 bg-white/80 focus:border-primary-300"
                  placeholder="Enter your username"
                />
              </div>
              <Button
                onClick={handleRequestCode}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
              >
                {isLoading ? "Sending..." : "Request Recovery Code"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-primary-700">Recovery Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="border-primary-200 bg-white/80 focus:border-primary-300"
                  placeholder="Enter the 6-digit code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-primary-700">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="border-primary-200 bg-white/80 focus:border-primary-300"
                  placeholder="Enter your new password"
                />
              </div>
              <Button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          )}
          {error && <p className="text-red-500 mt-2">{error}</p>}
          {message && <p className="text-green-500 mt-2">{message}</p>}
        </CardContent>
        <CardFooter className="border-t border-primary-100">
          <Link href="/admin/login" className="text-sm text-primary-600 hover:text-primary-800">Back to login</Link>
        </CardFooter>
      </Card>
    </div>
  )
}