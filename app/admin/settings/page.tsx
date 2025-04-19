"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Globe, Loader2, Palette, Save, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminSettingsPage() {
  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "Zelle Banking",
    supportEmail: "support@zellebank.example.com",
    supportPhone: "1-800-555-1234",
    instagramUrl: "",
    twitterUrl: "",
    facebookUrl: "",
    linkedinUrl: "",
    privacyPolicy: "",
    termsOfService: "",
  })

  // Appearance settings state
  const [appearanceSettings, setAppearanceSettings] = useState({
    primaryColor: "#6D1ED4",
    logoUrl: "/zelle-logo.svg",
    zelleLogoUrl: "/zelle-logo.svg",
    checkingIcon: "square",
    savingsIcon: "circle",
  })

  // Loading and alert states
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Handle general settings change
  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setGeneralSettings({ ...generalSettings, [name]: value })
  }

  // Handle appearance settings change
  const handleAppearanceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setAppearanceSettings({ ...appearanceSettings, [name]: value })
  }

  // Handle site logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAppearanceSettings({ ...appearanceSettings, logoUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Zelle logo file upload
  const handleZelleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAppearanceSettings({ ...appearanceSettings, zelleLogoUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle appearance select change
  const handleAppearanceSelect = (name: string, value: string) => {
    setAppearanceSettings({ ...appearanceSettings, [name]: value })
  }

  // Handle settings save
  const handleSaveSettings = async (settingsType: string) => {
    setIsLoading(true)
    setSuccess(null)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSuccess(`${settingsType} settings saved successfully`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      setError(`Failed to save ${settingsType.toLowerCase()} settings. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="p-6 max-w-5xl mx-auto">
        <Button
          variant="ghost"
          asChild
          className="p-0 mb-2 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 transition-colors"
        >
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
          Admin Settings
        </h1>

        {/* Success/Error Alerts */}
        {success && (
          <Alert className="mb-6 bg-green-50 border border-green-200 text-green-800">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-indigo-100/70 p-1 rounded-lg">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Globe className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Palette className="mr-2 h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general">
            <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-indigo-900">General Settings</CardTitle>
                <CardDescription className="text-indigo-600">
                  Configure basic site settings and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-indigo-800">
                      Site Name
                    </Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={generalSettings.siteName}
                      onChange={handleGeneralChange}
                      className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail" className="text-indigo-800">
                      Support Email
                    </Label>
                    <Input
                      id="supportEmail"
                      name="supportEmail"
                      type="email"
                      value={generalSettings.supportEmail}
                      onChange={handleGeneralChange}
                      className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportPhone" className="text-indigo-800">
                      Support Phone
                    </Label>
                    <Input
                      id="supportPhone"
                      name="supportPhone"
                      value={generalSettings.supportPhone}
                      onChange={handleGeneralChange}
                      className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-indigo-900">Social Media Links</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl" className="text-indigo-800">
                        Instagram URL
                      </Label>
                      <Input
                        id="instagramUrl"
                        name="instagramUrl"
                        type="url"
                        value={generalSettings.instagramUrl}
                        onChange={handleGeneralChange}
                        placeholder="https://instagram.com/yourprofile"
                        className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitterUrl" className="text-indigo-800">
                        Twitter URL
                      </Label>
                      <Input
                        id="twitterUrl"
                        name="twitterUrl"
                        type="url"
                        value={generalSettings.twitterUrl}
                        onChange={handleGeneralChange}
                        placeholder="https://twitter.com/yourprofile"
                        className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl" className="text-indigo-800">
                        Facebook URL
                      </Label>
                      <Input
                        id="facebookUrl"
                        name="facebookUrl"
                        type="url"
                        value={generalSettings.facebookUrl}
                        onChange={handleGeneralChange}
                        placeholder="https://facebook.com/yourprofile"
                        className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedinUrl" className="text-indigo-800">
                        LinkedIn URL
                      </Label>
                      <Input
                        id="linkedinUrl"
                        name="linkedinUrl"
                        type="url"
                        value={generalSettings.linkedinUrl}
                        onChange={handleGeneralChange}
                        placeholder="https://linkedin.com/company/yourcompany"
                        className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-indigo-900">Legal Information</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="privacyPolicy" className="text-indigo-800">
                        Privacy Policy
                      </Label>
                      <Textarea
                        id="privacyPolicy"
                        name="privacyPolicy"
                        value={generalSettings.privacyPolicy}
                        onChange={handleGeneralChange}
                        placeholder="Enter your privacy policy here..."
                        rows={6}
                        className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="termsOfService" className="text-indigo-800">
                        Terms of Service
                      </Label>
                      <Textarea
                        id="termsOfService"
                        name="termsOfService"
                        value={generalSettings.termsOfService}
                        onChange={handleGeneralChange}
                        placeholder="Enter your terms of service here..."
                        rows={6}
                        className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveSettings("General")}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Appearance Settings Tab */}
          <TabsContent value="appearance">
            <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-indigo-900">Appearance Settings</CardTitle>
                <CardDescription className="text-indigo-600">
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="text-indigo-800">
                    Primary Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      value={appearanceSettings.primaryColor}
                      onChange={handleAppearanceChange}
                      className="w-12 h-10 p-1 border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <Input
                      value={appearanceSettings.primaryColor}
                      onChange={handleAppearanceChange}
                      name="primaryColor"
                      className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-indigo-800">Site Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("logoUpload")?.click()}
                        className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </Button>
                    </div>
                    {appearanceSettings.logoUrl && (
                      <img src={appearanceSettings.logoUrl} alt="Logo preview" className="h-10 w-auto rounded" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-indigo-800">Zelle Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        id="zelleLogoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleZelleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("zelleLogoUpload")?.click()}
                        className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Zelle Logo
                      </Button>
                    </div>
                    {appearanceSettings.zelleLogoUrl && (
                      <img src={appearanceSettings.zelleLogoUrl} alt="Zelle Logo preview" className="h-10 w-auto rounded" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-indigo-800">Account Icons</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkingIcon" className="text-indigo-800">
                        Checking Account Icon
                      </Label>
                      <Select
                        value={appearanceSettings.checkingIcon}
                        onValueChange={(value) => handleAppearanceSelect("checkingIcon", value)}
                      >
                        <SelectTrigger
                          id="checkingIcon"
                          className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        >
                          <SelectValue placeholder="Select icon shape" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="savingsIcon" className="text-indigo-800">
                        Savings Account Icon
                      </Label>
                      <Select
                        value={appearanceSettings.savingsIcon}
                        onValueChange={(value) => handleAppearanceSelect("savingsIcon", value)}
                      >
                        <SelectTrigger
                          id="savingsIcon"
                          className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        >
                          <SelectValue placeholder="Select icon shape" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="diamond">Diamond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <div className="text-sm">
                    <p className="font-medium">Preview</p>
                    <div className="mt-2 flex justify-center">
                      <div className="border rounded-md p-4 bg-background">
                        <div className="flex items-center gap-2 mb-4">
                          <img
                            src={appearanceSettings.logoUrl || "/placeholder.svg"}
                            alt="Logo"
                            className="h-8 w-auto"
                          />
                          <span className="font-bold">{generalSettings.siteName}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button style={{ backgroundColor: appearanceSettings.primaryColor }}>Primary Button</Button>
                          <Button variant="outline">Secondary Button</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveSettings("Appearance")}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
