"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, Save, ArrowLeft, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminProfilePage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage("Profile information updated successfully")
    setErrorMessage("")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage("Password changed successfully")
    setErrorMessage("")
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container px-4 py-6 md:py-8 max-w-6xl mx-auto">
        {/* Back to Dashboard Section */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="mb-4 bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
          >
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center mb-2">
            <img src="/zelle-logo.svg" alt="Zelle" className="h-8 w-auto mr-2" />
            <Badge variant="secondary">Admin</Badge>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-indigo-600">Manage your account settings and preferences</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert className="mb-6 bg-green-50 text-green-700 border-green-200">
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}
        {errorMessage && (
          <Alert className="mb-6 bg-red-50 text-red-700 border-red-200">
            <AlertDescription className="text-red-700">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Profile Image Section */}
          <div className="md:col-span-1">
            <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4 border-4 border-indigo-100">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      AU
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-lg text-indigo-900">Admin User</h3>
                  <p className="text-indigo-600 text-sm">admin@zellebank.com</p>
                  <Badge className="mt-2 bg-indigo-100 text-indigo-800 border-indigo-200">Administrator</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Tabs */}
          <div className="md:col-span-3">
            <Tabs defaultValue="profile">
              <TabsList className="grid w-full grid-cols-2 bg-indigo-100/70 p-1 rounded-lg">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
                >
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-4">
                <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-indigo-900">Profile Information</CardTitle>
                    <CardDescription className="text-indigo-600">
                      Update your personal information and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSaveProfile}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-indigo-800">
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            defaultValue="Admin"
                            className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-indigo-800">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            defaultValue="User"
                            className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <Label htmlFor="email" className="text-indigo-800">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue="admin@zellebank.com"
                          className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                      </div>
                      <div className="space-y-2 mb-4">
                        <Label htmlFor="phone" className="text-indigo-800">
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          defaultValue="+1 (555) 123-4567"
                          className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button
                      type="submit"
                      onClick={handleSaveProfile}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-4">
                <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="text-indigo-900">Change Password</CardTitle>
                    <CardDescription className="text-indigo-600">
                      Update your password to maintain account security
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleChangePassword}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword" className="text-indigo-800">
                            Current Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-indigo-800">
                            New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-indigo-800">
                            Confirm New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Password must be at least 8 characters long</div>
                    <Button
                      type="submit"
                      onClick={handleChangePassword}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
