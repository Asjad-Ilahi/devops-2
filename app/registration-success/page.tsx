"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle, Clock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegistrationSuccessPage() {
  const router = useRouter()

  // Optional: Auto-redirect after a certain time
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login")
    }, 60000) // 60 seconds

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Registration Successful</CardTitle>
          <CardDescription className="text-base">Your account has been created</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium text-amber-800">Pending Approval</p>
              <p className="text-sm text-amber-700">
                Your account is currently under review by our team. This process typically takes 1-2 business days.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="font-medium text-blue-800">Check Your Email</p>
              <p className="text-sm text-blue-700">
                We've sent a confirmation email to your registered address. You'll receive another email once your
                account is approved.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground">
              If you have any questions or need assistance, please contact our support team.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full" asChild>
            <Link href="/login">Return to Login</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
