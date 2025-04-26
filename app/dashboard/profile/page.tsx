"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Phone,
  User,
  Key,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Color from 'color'
import { useAuth } from '@/lib/auth'
import { apiFetch } from '@/lib/api'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
}

export default function ProfilePage() {
  useAuth() // Proactively check token validity and handle expiration

  const [profileForm, setProfileForm] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  })
  const [lastLogin, setLastLogin] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [preferredMethod, setPreferredMethod] = useState("email")
  const [newPreferredMethod, setNewPreferredMethod] = useState("")
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")
  const [verificationType, setVerificationType] = useState<"password" | "method" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [colors, setColors] = useState<{ primaryColor: string; secondaryColor: string } | null>(null)

  // Fetch colors (public endpoint, no auth required)
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

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiFetch("/api/user")
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to fetch profile")
        }
        const data = await response.json()
        setProfileForm({
          firstName: data.fullName?.split(" ")[0] || "",
          lastName: data.fullName?.split(" ")[1] || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.streetAddress || "",
          city: data.city || "",
          state: data.state || "",
          zipCode: data.zipCode || "",
        })
        setLastLogin(data.lastLogin ? new Date(data.lastLogin).toLocaleString() : "Never")
        setCreatedAt(data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Unknown")
      } catch (error) {
        if (error instanceof Error && error.message !== 'Unauthorized') {
          console.error("Error fetching profile:", error)
          setError(error.message)
        }
      }
    }
    fetchProfile()
  }, [])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm({ ...profileForm, [name]: value })
  }

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    setSuccess(null)
    setError(null)

    try {
      const response = await apiFetch("/api/user", {
        method: "PUT",
        body: JSON.stringify({
          fullName: `${profileForm.firstName} ${profileForm.lastName}`,
          email: profileForm.email,
          phone: profileForm.phone || "",
          streetAddress: profileForm.address,
          city: profileForm.city,
          state: profileForm.state,
          zipCode: profileForm.zipCode,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update profile")
      }

      setSuccess("Profile updated successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        setError(error.message)
      } else if (!(error instanceof Error)) {
        setError("An unknown error occurred while updating the profile")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const initiatePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await apiFetch("/api/user-password-change", {
        method: "POST",
        body: JSON.stringify({
          email: profileForm.email,
          step: "requestCode",
          currentPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send verification code")
      }

      setVerificationType("password")
      setShow2FAModal(true)
      setVerificationCode("")
      setSuccess("Verification code sent to your email.")
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        console.error("Error initiating password change:", error)
        setError(error.message)
      } else if (!(error instanceof Error)) {
        setError("An unknown error occurred while initiating password change")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiFetch("/api/user-password-change", {
        method: "POST",
        body: JSON.stringify({
          email: profileForm.email,
          step: "verifyCode",
          newPassword,
          verificationCode,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to change password")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token) // Update token

      setSuccess("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShow2FAModal(false)
      setVerificationCode("")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        setError(error.message)
      } else if (!(error instanceof Error)) {
        setError("An unknown error occurred while changing the password")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const initiateMethodChange = async (value: string) => {
    setNewPreferredMethod(value)
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiFetch("/api/user-password-change", {
        method: "POST",
        body: JSON.stringify({
          email: profileForm.email,
          step: "requestCode",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send verification code")
      }

      setVerificationType("method")
      setShow2FAModal(true)
      setVerificationCode("")
      setSuccess(`Verification code sent to your ${value}.`)
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        console.error("Error initiating 2FA method change:", error)
        setError(error.message)
      } else if (!(error instanceof Error)) {
        setError("An unknown error occurred while initiating 2FA method change")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!verificationCode) {
      setError("Please enter the verification code")
      setIsLoading(false)
      return
    }

    try {
      if (verificationType === "password") {
        await handlePasswordChange()
      } else if (verificationType === "method" && newPreferredMethod) {
        const response = await apiFetch("/api/user/update-2fa-method", {
          method: "POST",
          body: JSON.stringify({
            method: newPreferredMethod,
            verificationCode,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to update 2FA method")
        }

        setPreferredMethod(newPreferredMethod)
        setSuccess("Verification method updated successfully")
        setShow2FAModal(false)
        setVerificationCode("")
        setVerificationType(null)
        setNewPreferredMethod("")
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        setError(error.message)
      } else if (!(error instanceof Error)) {
        setError("An unknown error occurred during 2FA verification")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const render2FAModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl font-bold text-primary-900">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-primary-700">
            Enter the 6-digit code sent to your {preferredMethod === "email" ? "email" : "phone"}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          {error && (
            <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50/70">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50/70">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{success}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {preferredMethod === "email" && (
              <div className="text-sm text-primary-600">Code sent to {profileForm.email}</div>
            )}
            {preferredMethod === "sms" && (
              <div className="text-sm text-primary-600">Code sent to {profileForm.phone}</div>
            )}
            <div className="space-y-2">
              <Label htmlFor="verificationCode" className="text-primary-800 font-medium">
                Verification Code
              </Label>
              <Input
                id="verificationCode"
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 relative z-10">
          <Button
            variant="outline"
            onClick={() => setShow2FAModal(false)}
            className="border-primary-200 text-primary-700 hover:bg-primary-50"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handle2FAVerification}
            className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )

  const getInitials = () => {
    const firstInitial = profileForm.firstName.charAt(0).toUpperCase() || ""
    const lastInitial = profileForm.lastName.charAt(0).toUpperCase() || ""
    return `${firstInitial}${lastInitial}` || "U"
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="p-0 mb-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100 transition-colors"
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
            Profile Settings
          </h1>
        </div>

        {success && !show2FAModal && (
          <Alert className="mb-6 border-green-200 bg-green-50/70">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">{success}</AlertDescription>
          </Alert>
        )}

        {error && !show2FAModal && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50/70">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-4">
          <Card className="md:col-span-1 backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 relative z-10">
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="bg-primary-100 text-primary-700">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-primary-900">
                    {profileForm.firstName} {profileForm.lastName}
                  </h3>
                  <p className="text-sm text-primary-600">{profileForm.email}</p>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-primary-800">Account Details</h4>
                <p className="text-sm text-primary-600">Member since {createdAt || "Loading..."}</p>
                <p className="text-sm text-primary-600">Last login: {lastLogin || "Loading..."}</p>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-3">
            <Tabs defaultValue="personal">
              <TabsList className="grid w-full grid-cols-3 bg-primary-100/70 p-1 rounded-lg mb-6">
                <TabsTrigger
                  value="personal"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
                >
                  Personal
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
                >
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="2fa"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
                >
                  Two-Factor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-xl font-bold text-primary-900">Personal Information</CardTitle>
                    <CardDescription className="text-primary-700">
                      Update your personal information and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 relative z-10">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-primary-800 font-medium">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profileForm.firstName}
                          onChange={handleProfileChange}
                          className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-primary-800 font-medium">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profileForm.lastName}
                          onChange={handleProfileChange}
                          className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-primary-800 font-medium">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-600" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={profileForm.email}
                            onChange={handleProfileChange}
                            className="pl-10 border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-primary-800 font-medium">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-600" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={profileForm.phone}
                            onChange={handleProfileChange}
                            className="pl-10 border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-primary-800 font-medium">
                        Street Address
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={profileForm.address}
                        onChange={handleProfileChange}
                        className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-primary-800 font-medium">
                          City
                        </Label>
                        <Input
                          id="city"
                          name="city"
                          value={profileForm.city}
                          onChange={handleProfileChange}
                          className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-primary-800 font-medium">
                          State
                        </Label>
                        <Input
                          id="state"
                          name="state"
                          value={profileForm.state}
                          onChange={handleProfileChange}
                          className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode" className="text-primary-800 font-medium">
                          ZIP Code
                        </Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={profileForm.zipCode}
                          onChange={handleProfileChange}
                          className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end relative z-10">
                    <Button
                      onClick={handleProfileUpdate}
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-xl font-bold text-primary-900">Security Settings</CardTitle>
                    <CardDescription className="text-primary-700">
                      Update your password and security preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 relative z-10">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-primary-800 font-medium">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-600" />
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pl-10 border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4 text-primary-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-primary-600" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-primary-800 font-medium">
                          New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-primary-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-primary-600" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-primary-800 font-medium">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-primary-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-primary-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-primary-600">
                      <p>Password requirements:</p>
                      <ul className="list-disc list-inside pl-4 space-y-1 mt-1">
                        <li>At least 8 characters long</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one number</li>
                        <li>At least one special character</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between relative z-10">
                    <Button
                      variant="outline"
                      className="border-primary-200 text-primary-700 hover:bg-primary-50"
                    >
                      Log Out
                    </Button>
                    <Button
                      onClick={initiatePasswordChange}
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="2fa">
                <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
                  <CardHeader className="relative z-10">
                    <CardTitle className="text-xl font-bold text-primary-900">Two-Factor Authentication</CardTitle>
                    <CardDescription className="text-primary-700">
                      Manage your two-factor authentication method
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 relative z-10">
                    <div className="pt-4">
                      <h3 className="text-lg font-medium text-primary-900 mb-4">Verification Method</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Select value={preferredMethod} onValueChange={initiateMethodChange}>
                            <SelectTrigger className="w-full border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500">
                              <SelectValue placeholder="Select verification method" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/90 border-primary-100">
                              <SelectItem value="email">Email</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {preferredMethod === "email" && (
                          <div className="p-4 border border-primary-100 rounded-md bg-primary-50/70">
                            <div className="flex items-center">
                              <Mail className="h-5 w-5 mr-2 text-primary-600" />
                              <div>
                                <div className="font-medium text-primary-900">Email Verification</div>
                                <div className="text-sm text-primary-600">
                                  We'll send a verification code to {profileForm.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {preferredMethod === "sms" && (
                          <div className="p-4 border border-primary-100 rounded-md bg-primary-50/70">
                            <div className="flex items-center">
                              <Phone className="h-5 w-5 mr-2 text-primary-600" />
                              <div>
                                <div className="font-medium text-primary-900">SMS Verification</div>
                                <div className="text-sm text-primary-600">
                                  We'll send a verification code to {profileForm.phone}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end relative z-10">
                    <Button
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {show2FAModal && render2FAModal()}
      </div>
    </div>
  )
}