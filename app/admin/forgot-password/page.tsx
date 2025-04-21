"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Color from "color"
import { ArrowLeft, Loader2, ShieldAlert } from "lucide-react"
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

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [colors, setColors] = useState<Colors | null>(null)

  // Fetch colors and set CSS custom properties
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
    fetchColors()
  }, [])

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
    <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
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

          <Card className="border-primary-100 bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="border-b border-gray-100 bg-gray-50">
              <CardTitle className="flex items-center text-xl text-gray-800">
                <ShieldAlert className="mr-2 h-5 w-5 text-primary-600" />
                Password Recovery
              </CardTitle>
              <CardDescription className="text-gray-600">
                Secure password reset for authorized administrators
              </CardDescription>
            </CardHeader>

            {error && (
              <Alert variant="destructive" className="mx-6 mt-6 bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
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
                    className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
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