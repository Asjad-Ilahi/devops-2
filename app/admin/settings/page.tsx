"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Globe, Loader2, Palette, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Color from 'color';

export default function AdminSettingsPage() {
  const router = useRouter();

  // Authentication and loading states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Consolidated settings state
  const [settings, setSettings] = useState({
    siteName: "Zelle Banking",
    supportEmail: "support@zellebank.example.com",
    supportPhone: "1-800-555-1234",
    instagramUrl: "https://instagram.com",
    twitterUrl: "https://twitter.com",
    facebookUrl: "https://facebook.com",
    privacyPolicy: "",
    termsOfService: "",
    primaryColor: "#5f6cd3",
    secondaryColor: "#9c65d2",
    logoUrl: "/zelle-logo.svg",
    zelleLogoUrl: "/zelle-logo.svg",
    checkingIcon: "square",
    savingsIcon: "circle",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<{ primaryColor: string; secondaryColor: string } | null>(null);

  // Fetch settings and colors
  useEffect(() => {
    const checkAuthAndFetchSettings = async () => {
      try {
        const authResponse = await fetch("/api/admin/check-auth", {
          method: "GET",
          credentials: "include",
        });

        if (!authResponse.ok) {
          router.push("/admin/login");
          return;
        }

        setIsAuthenticated(true);

        const settingsResponse = await fetch("/api/admin/settings", {
          method: "GET",
          credentials: "include",
        });

        if (!settingsResponse.ok) {
          if (settingsResponse.status === 401) {
            setError("Unauthorized access. Please log in again.");
            router.push("/admin/login");
            return;
          } else if (settingsResponse.status === 404) {
            setError("Settings not found. Using default values. Save to create settings.");
            return;
          }
          throw new Error(`HTTP error! Status: ${settingsResponse.status}`);
        }

        const data = await settingsResponse.json();
        setSettings({
          siteName: data.siteName || "Zelle Banking",
          supportEmail: data.supportEmail || "support@zellebank.example.com",
          supportPhone: data.supportPhone || "1-800-555-1234",
          instagramUrl: data.instagramUrl || "https://instagram.com",
          twitterUrl: data.twitterUrl || "https://twitter.com",
          facebookUrl: data.facebookUrl || "https://facebook.com",
          privacyPolicy: data.privacyPolicy || "",
          termsOfService: data.termsOfService || "",
          primaryColor: data.primaryColor || "#5f6cd3",
          secondaryColor: data.secondaryColor || "#9c65d2",
          logoUrl: data.logoUrl || "/zelle-logo.svg",
          zelleLogoUrl: data.zelleLogoUrl || "/zelle-logo.svg",
          checkingIcon: data.checkingIcon || "square",
          savingsIcon: data.savingsIcon || "circle",
        });

        // Fetch colors from API
        const colorsResponse = await fetch('/api/colors');
        if (colorsResponse.ok) {
          const colorsData = await colorsResponse.json();
          setColors(colorsData);

          const primary = Color(colorsData.primaryColor || "#5f6cd3");
          const secondary = Color(colorsData.secondaryColor || "#9c65d2");

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
          });

          const primaryShades = generateShades(primary);
          const secondaryShades = generateShades(secondary);

          Object.entries(primaryShades).forEach(([shade, color]) => {
            document.documentElement.style.setProperty(`--primary-${shade}`, color);
          });

          Object.entries(secondaryShades).forEach(([shade, color]) => {
            document.documentElement.style.setProperty(`--secondary-${shade}`, color);
          });
        } else {
          console.error('Failed to fetch colors');
        }
      } catch (error: any) {
        console.error("Error fetching settings or colors:", error);
        if (!error.message.includes("Unauthorized")) {
          setError("Failed to load settings from the server. Using default values.");
        }
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkAuthAndFetchSettings();
  }, [router]);

  // Handlers for form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "logoUrl" | "zelleLogoUrl") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, [field]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelect = (name: string, value: string) => {
    setSettings({ ...settings, [name]: value });
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Unauthorized. Redirecting to login...");
          router.push("/admin/login");
          return;
        }
        throw new Error(`Failed to save settings. Status: ${response.status}`);
      }

      setSuccess("Settings saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will handle redirect to /admin/login
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="p-6 max-w-5xl mx-auto">
        <Button
          variant="ghost"
          asChild
          className="p-0 mb-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100 transition-colors"
        >
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
          Admin Settings
        </h1>

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
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-primary-100/70 p-1 rounded-lg">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Globe className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Palette className="mr-2 h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary-900">General Settings</CardTitle>
                <CardDescription className="text-primary-600">
                  Configure basic site settings and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteName" className="text-primary-800">
                      Site Name
                    </Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={settings.siteName}
                      onChange={handleChange}
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail" className="text-primary-800">
                      Support Email
                    </Label>
                    <Input
                      id="supportEmail"
                      name="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={handleChange}
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportPhone" className="text-primary-800">
                      Support Phone
                    </Label>
                    <Input
                      id="supportPhone"
                      name="supportPhone"
                      value={settings.supportPhone}
                      onChange={handleChange}
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary-900">Social Media Links</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl" className="text-primary-800">
                        Instagram URL
                      </Label>
                      <Input
                        id="instagramUrl"
                        name="instagramUrl"
                        type="url"
                        value={settings.instagramUrl}
                        onChange={handleChange}
                        placeholder="https://instagram.com/yourprofile"
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitterUrl" className="text-primary-800">
                        Twitter URL
                      </Label>
                      <Input
                        id="twitterUrl"
                        name="twitterUrl"
                        type="url"
                        value={settings.twitterUrl}
                        onChange={handleChange}
                        placeholder="https://twitter.com/yourprofile"
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl" className="text-primary-800">
                        Facebook URL
                      </Label>
                      <Input
                        id="facebookUrl"
                        name="facebookUrl"
                        type="url"
                        value={settings.facebookUrl}
                        onChange={handleChange}
                        placeholder="https://facebook.com/yourprofile"
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-primary-900">Legal Information</h3>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="privacyPolicy" className="text-primary-800">
                        Privacy Policy
                      </Label>
                      <Textarea
                        id="privacyPolicy"
                        name="privacyPolicy"
                        value={settings.privacyPolicy}
                        onChange={handleChange}
                        placeholder="Enter your privacy policy here..."
                        rows={6}
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="termsOfService" className="text-primary-800">
                        Terms of Service
                      </Label>
                      <Textarea
                        id="termsOfService"
                        name="termsOfService"
                        value={settings.termsOfService}
                        onChange={handleChange}
                        placeholder="Enter your terms of service here..."
                        rows={6}
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
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

          <TabsContent value="appearance">
            <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary-900">Appearance Settings</CardTitle>
                <CardDescription className="text-primary-600">
                  Customize the look and feel of the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="text-primary-800">
                    Primary Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={handleChange}
                      className="w-12 h-10 p-1 border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={handleChange}
                      name="primaryColor"
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor" className="text-primary-800">
                    Secondary Color
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      value={settings.secondaryColor}
                      onChange={handleChange}
                      className="w-12 h-10 p-1 border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                    <Input
                      value={settings.secondaryColor}
                      onChange={handleChange}
                      name="secondaryColor"
                      className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-primary-800">Site Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, "logoUrl")}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("logoUpload")?.click()}
                        className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Logo
                      </Button>
                    </div>
                    {settings.logoUrl && (
                      <img src={settings.logoUrl} alt="Logo preview" className="h-10 w-auto rounded" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-primary-800">Zelle Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        id="zelleLogoUpload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload(e, "zelleLogoUrl")}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById("zelleLogoUpload")?.click()}
                        className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Zelle Logo
                      </Button>
                    </div>
                    {settings.zelleLogoUrl && (
                      <img src={settings.zelleLogoUrl} alt="Zelle Logo preview" className="h-10 w-auto rounded" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-primary-800">Account Icons</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkingIcon" className="text-primary-800">
                        Checking Account Icon
                      </Label>
                      <Select
                        value={settings.checkingIcon}
                        onValueChange={(value) => handleSelect("checkingIcon", value)}
                      >
                        <SelectTrigger
                          id="checkingIcon"
                          className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
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
                      <Label htmlFor="savingsIcon" className="text-primary-800">
                        Savings Account Icon
                      </Label>
                      <Select
                        value={settings.savingsIcon}
                        onValueChange={(value) => handleSelect("savingsIcon", value)}
                      >
                        <SelectTrigger
                          id="savingsIcon"
                          className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
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
                            src={settings.logoUrl || "/placeholder.svg"}
                            alt="Logo"
                            className="h-8 w-auto"
                          />
                          <span className="font-bold">{settings.siteName}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button style={{ backgroundColor: settings.primaryColor }}>
                            Primary Button
                          </Button>
                          <Button variant="outline">Secondary Button</Button>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div style={{ backgroundColor: settings.secondaryColor, width: '20px', height: '20px', borderRadius: '4px' }}></div>
                          <span className="text-sm text-gray-600">Secondary Color</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
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
  );
}