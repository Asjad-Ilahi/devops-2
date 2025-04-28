"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Loader2, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("")
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  const [verificationCode, setVerificationCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isResetSubmitting, setIsResetSubmitting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("request")

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsRequestSubmitting(true)

    if (!username) {
      setError("Please enter your username")
      setIsRequestSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, step: "requestCode" }),
      })
      const data = await response.json()
      if (response.ok) {
        setMessage(data.message || "Verification code sent to your registered email")
        setRequestSuccess(true)
        setActiveTab("reset")
      } else {
        setError(data.error || "An error occurred. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsRequestSubmitting(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsResetSubmitting(true)

    if (!verificationCode) {
      setError("Please enter the verification code")
      setIsResetSubmitting(false)
      return
    }

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password")
      setIsResetSubmitting(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setIsResetSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          step: "verifyCode",
          verificationCode,
          newPassword,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setResetSuccess(true)
        setMessage(data.message || "Password reset successfully")
      } else {
        setError(data.error || "An error occurred. Please try again.")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsResetSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/zelle-logo.svg" alt="Zelle" className="h-12 w-auto mx-auto" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Reset your password</h2>
          <p className="mt-2 text-sm text-muted-foreground">Enter your username to receive a password reset code</p>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="request" disabled={resetSuccess}>
                Request Reset
              </TabsTrigger>
              <TabsTrigger value="reset" disabled={!requestSuccess || resetSuccess}>
                Reset Password
              </TabsTrigger>
            </TabsList>

            <TabsContent value="request">
              <form onSubmit={handleRequestSubmit}>
                <CardHeader>
                  <CardTitle className="text-xl">Request Password Reset</CardTitle>
                  <CardDescription>We'll send a verification code to your registered email</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {message && activeTab === "request" && (
                    <Alert>
                      <Check className="h-4 w-4" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        className="pl-10"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isRequestSubmitting || requestSuccess}
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full" disabled={isRequestSubmitting || requestSuccess}>
                    {isRequestSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : requestSuccess ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Code Sent
                      </>
                    ) : (
                      "Send Reset Code"
                    )}
                  </Button>

                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/login">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Link>
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="reset">
              <form onSubmit={handleResetSubmit}>
                <CardHeader>
                  <CardTitle className="text-xl">Reset Your Password</CardTitle>
                  <CardDescription>Enter the verification code and your new password</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {resetSuccess && (
                    <Alert>
                      <Check className="h-4 w-4" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Verification Code</Label>
                    <Input
                      id="verificationCode"
                      placeholder="Enter verification code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isResetSubmitting || resetSuccess}
                    />
                    <p className="text-xs text-muted-foreground">Check your registered email for the code sent for {username}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isResetSubmitting || resetSuccess}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isResetSubmitting || resetSuccess}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-2">
                  {resetSuccess ? (
                    <Button className="w-full" asChild>
                      <Link href="/login">Return to Login</Link>
                    </Button>
                  ) : (
                    <>
                      <Button type="submit" className="w-full" disabled={isResetSubmitting}>
                        {isResetSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setActiveTab("request")}
                        disabled={isResetSubmitting}
                      >
                        Back to Request
                      </Button>
                    </>
                  )}
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}