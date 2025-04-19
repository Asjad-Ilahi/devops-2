"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setIsSubmitted(true)
    } catch (error) {
      setError("An error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reset Admin Password</h1>
            <p className="mt-2 text-sm text-gray-600">
              We'll send you instructions to reset your administrator password
            </p>
          </div>

          <Card className="border-indigo-100 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-gray-100 bg-gray-50">
              <CardTitle className="flex items-center text-xl text-gray-800">
                <ShieldAlert className="mr-2 h-5 w-5 text-blue-600" />
                Password Recovery
              </CardTitle>
              <CardDescription className="text-gray-600">
                Secure password reset for authorized administrators
              </CardDescription>
            </CardHeader>

            {error && (
              <Alert variant="destructive" className="mx-6 mt-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <CardContent className="pt-6">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">
                      Email Address
                    </Label>
                    <p className="text-sm text-gray-600 mb-2">
                      Enter the email address associated with your administrator account
                    </p>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@bankdomain.com"
                      className="border-gray-300"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Send Reset Instructions"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="py-4 text-center">
                  <div className="rounded-full bg-green-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="h-6 w-6 text-green-600"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Reset Instructions Sent</h3>
                  <p className="text-gray-600 mb-4">
                    If an account exists with the email <span className="font-medium text-gray-800">{email}</span>, you
                    will receive password reset instructions shortly.
                  </p>
                  <p className="text-sm text-gray-500">
                    Please check your email and follow the instructions to reset your password.
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t border-gray-100 flex justify-center">
              <Button variant="link" className="text-gray-600 hover:text-gray-800" asChild>
                <Link href="/admin/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to admin login
                </Link>
              </Button>
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
