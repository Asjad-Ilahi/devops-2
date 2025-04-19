"use client"

import { Checkbox } from "@/components/ui/checkbox"
import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NewUserPage() {
  const router = useRouter()

  // User form state aligned with Code-02
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    ssn: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    username: "",
    password: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    balance: 0,
    savingsBalance: 0,
    cryptoBalance: 0,
  })

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Loading and alert states
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // US states list from Code-02
  const usStates = [
    { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }, { value: "DC", label: "District of Columbia" },
  ]

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (["balance", "savingsBalance", "cryptoBalance"].includes(name)) {
      setUserForm({ ...userForm, [name]: value === "" ? 0 : Number(value) })
    } else {
      setUserForm({ ...userForm, [name]: value })
    }
  }

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    const digits = value.replace(/\D/g, "")
    let formatted = ""
    if (digits.length > 0) {
      formatted += digits.substring(0, Math.min(3, digits.length))
      if (digits.length > 3) formatted += "-" + digits.substring(3, Math.min(5, digits.length))
      if (digits.length > 5) formatted += "-" + digits.substring(5, Math.min(9, digits.length))
    }
    setUserForm({ ...userForm, ssn: formatted })
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    const digits = value.replace(/\D/g, "").substring(0, 10)
    setUserForm({ ...userForm, phone: digits })
  }

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target
    const digits = value.replace(/\D/g, "").substring(0, 5)
    setUserForm({ ...userForm, zipCode: digits })
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setUserForm({ ...userForm, [name]: value })
  }

  // Handle toggle changes
  const handleToggleChange = (name: string, value: boolean) => {
    setUserForm({ ...userForm, [name]: value })
  }

  // Generate two-factor code
  const generateTwoFactorCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(null)
    setError(null)

    // Validate form (from Code-02)
    if (
      !userForm.fullName ||
      !userForm.email ||
      !userForm.phone ||
      !userForm.ssn ||
      !userForm.streetAddress ||
      !userForm.city ||
      !userForm.state ||
      !userForm.zipCode ||
      !userForm.username ||
      !userForm.password ||
      !userForm.confirmPassword
    ) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    if (!/^\d{10}$/.test(userForm.phone)) {
      setError("Phone number must be 10 digits")
      setIsLoading(false)
      return
    }

    if (!/^\d{3}-\d{2}-\d{4}$/.test(userForm.ssn)) {
      setError("SSN must be in the format XXX-XX-XXXX")
      setIsLoading(false)
      return
    }

    if (!/^\d{5}$/.test(userForm.zipCode)) {
      setError("Zip code must be 5 digits")
      setIsLoading(false)
      return
    }

    if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      setError("Email is invalid")
      setIsLoading(false)
      return
    }

    if (userForm.password !== userForm.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    const { confirmPassword, ...userData } = userForm
    const twoFactorCode = userData.twoFactorEnabled ? generateTwoFactorCode() : ""
    const dataToSend = { ...userData, twoFactorCode }

    try {
      const response = await fetch("/api/admin/admin-create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired or unauthorized. Please log in again.")
          setTimeout(() => router.push("/admin/login"), 2000)
          return
        } else if (response.status === 403) {
          setError("You do not have permission to create users.")
          return
        } else {
          throw new Error(result.error || "Failed to create user")
        }
      }

      setSuccess(
        `User created successfully with ID: ${result.userId}\nChecking Account: ${result.accountNumber}\nSavings Account: ${result.savingsNumber}\nCrypto Account: ${result.cryptoNumber}`
      )

      // Reset form (aligned with Code-02)
      setUserForm({
        fullName: "",
        email: "",
        phone: "",
        ssn: "",
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        username: "",
        password: "",
        confirmPassword: "",
        twoFactorEnabled: false,
        balance: 0,
        savingsBalance: 0,
        cryptoBalance: 0,
      })
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="p-0 mb-2 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 transition-colors"
          >
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Users
            </Link>
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
            Create New User
          </h1>
        </div>

        {/* Success/Error Alerts */}
        {success && (
          <Alert className="mb-6 bg-green-50 border border-green-200 text-green-800">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 whitespace-pre-line">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-indigo-100/70 p-1 rounded-lg">
              <TabsTrigger
                value="basic"
                id="basic-tab"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Basic Information
              </TabsTrigger>
              <TabsTrigger
                value="account"
                id="account-tab"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Account Settings
              </TabsTrigger>
              <TabsTrigger
                value="financial"
                id="financial-tab"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Financial Details
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic">
              <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-indigo-900">Basic Information</CardTitle>
                  <CardDescription className="text-indigo-600">Enter the user's personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-indigo-800">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={userForm.fullName}
                        onChange={handleChange}
                        required
                        className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email Address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={userForm.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        maxLength={10}
                        value={userForm.phone}
                        onChange={handlePhoneChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ssn">
                        SSN <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ssn"
                        name="ssn"
                        maxLength={11}
                        placeholder="XXX-XX-XXXX"
                        value={userForm.ssn}
                        onChange={handleSSNChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">
                      Street Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="streetAddress"
                      name="streetAddress"
                      value={userForm.streetAddress}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        City <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        value={userForm.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">
                        State <span className="text-red-500">*</span>
                      </Label>
                      <Select value={userForm.state} onValueChange={(value) => handleSelectChange("state", value)}>
                        <SelectTrigger id="state">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {usStates.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">
                        Zip Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        maxLength={5}
                        value={userForm.zipCode}
                        onChange={handleZipChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">
                        Username <span className="text-red-500">*</span>
                      </Label>
                      <Input id="username" name="username" value={userForm.username} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={userForm.password}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={userForm.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    asChild
                    className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                  >
                    <Link href="/admin/users">Cancel</Link>
                  </Button>
                  <Button
                    type="button"
                    onClick={() => document.getElementById("account-tab")?.click()}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    Next: Account Settings
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Account Settings Tab */}
            <TabsContent value="account" id="account-tab">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Configure the user's account settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground">Enable two-factor authentication for this user</p>
                    </div>
                    <Switch
                      checked={userForm.twoFactorEnabled}
                      onCheckedChange={(value) => handleToggleChange("twoFactorEnabled", value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => document.getElementById("basic-tab")?.click()}>
                    Previous: Basic Information
                  </Button>
                  <Button type="button" onClick={() => document.getElementById("financial-tab")?.click()}>
                    Next: Financial Details
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Financial Details Tab */}
            <TabsContent value="financial" id="financial-tab">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Details</CardTitle>
                  <CardDescription>Set up the user's financial accounts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="balance">Initial Checking Balance</Label>
                      <Input
                        id="balance"
                        name="balance"
                        type="number"
                        min="0"
                        step="0.01"
                        value={userForm.balance}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="savingsBalance">Initial Savings Balance</Label>
                      <Input
                        id="savingsBalance"
                        name="savingsBalance"
                        type="number"
                        min="0"
                        step="0.01"
                        value={userForm.savingsBalance}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cryptoBalance">Initial Crypto Balance</Label>
                      <Input
                        id="cryptoBalance"
                        name="cryptoBalance"
                        type="number"
                        min="0"
                        step="0.01"
                        value={userForm.cryptoBalance}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Checking Account Number</Label>
                      <Input value="Generated on creation (CHK-XXXXXXXX)" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Savings Account Number</Label>
                      <Input value="Generated on creation (SAV-XXXXXXXX)" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Crypto Account Number</Label>
                      <Input value="Generated on creation (BTC-XXXXXXXX)" disabled />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("account-tab")?.click()}
                  >
                    Previous: Account Settings
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating User...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Create User
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  )
}