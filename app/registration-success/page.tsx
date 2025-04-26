"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, Mail } from "lucide-react"
import Color from 'color'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegistrationSuccessPage() {
  const router = useRouter()
  const [colors, setColors] = useState<{ primaryColor: string; secondaryColor: string } | null>(null)

  // Fetch colors
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch('/api/colors')
        if (response.ok) {
          const data = await response.json()
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
        } else {
          console.error('Failed to fetch colors')
        }
      } catch (error) {
        console.error('Error fetching colors:', error)
      }
    }
    fetchColors()
  }, [])

  // Auto-redirect after a certain time
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login")
    }, 60000) // 60 seconds

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 px-4 py-12">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary-900">Registration Successful</CardTitle>
          <CardDescription className="text-base text-primary-700">Your account has been created</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium text-primary-800">Pending Approval</p>
              <p className="text-sm text-primary-700">
                Your account is currently under review by our team.
              </p>
            </div>
          </div>



          <div className="pt-2">
            <p className="text-sm text-primary-600">
              If you have any questions or need assistance, please contact our support team.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white">
            <Link href="/login">Return to Login</Link>
          </Button>
          <Button variant="outline" className="w-full border-primary-200 text-primary-700 hover:bg-primary-50">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}