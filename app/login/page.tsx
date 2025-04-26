"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Color from "color";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [colors, setColors] = useState<{ primaryColor: string; secondaryColor: string } | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("/api/colors");
        if (response.ok) {
          const data = await response.json();
          setColors(data);
          const primary = Color(data.primaryColor);
          const secondary = Color(data.secondaryColor);
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
          console.error("Failed to fetch colors");
        }
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/home");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        } else {
          setSettings(null);
        }
      } catch (error) {
        setSettings(null);
      }
    };
    fetchSettings();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoginLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, step: "requestCode" }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          setError(
            `${data.error} If you believe this is an error, please contact support.`
          );
        } else {
          setError(data.error || "An error occurred during login.");
        }
        setIsLoginLoading(false);
        return;
      }

      setShowTwoFactor(true);
      setIsLoginLoading(false);
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.");
      setIsLoginLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsTwoFactorLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, twoFactorCode, step: "verifyCode" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Invalid verification code.");
        setIsTwoFactorLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      router.push(data.redirect);
    } catch (error) {
      setError("Invalid verification code or an unexpected error occurred.");
      setIsTwoFactorLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full blur opacity-25"></div>
              {settings?.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="Site Logo"
                  className="relative h-12 w-auto"
                />
              ) : (
                <img
                  src="/zelle-logo.svg"
                  alt="Zelle"
                  className="relative h-12 w-auto"
                />
              )}
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-primary-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Register here
            </Link>
          </p>
        </div>
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.includes("contact support") ? (
                <>
                  {error.split(" If")[0]}.{" "}
                  <Link href="/contact" className="font-medium text-red-600 hover:text-red-500">
                    Contact Support
                  </Link>
                </>
              ) : (
                error
              )}
            </AlertDescription>
          </Alert>
        )}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl blur-sm opacity-30"></div>
          <div className="relative bg-white p-6 sm:p-8 rounded-xl shadow-xl">
            {!showTwoFactor ? (
              <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-primary-700">
                      Username
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="mt-1 bg-primary-50 border-primary-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-primary-700">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pr-10 bg-primary-50 border-primary-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-primary-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-primary-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
                <div className="text-center">
                  <p className="text-sm text-primary-600">
                    By signing in, you agree to our{" "}
                    <Link href="#" className="font-medium text-primary-600 hover:text-primary-500">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="font-medium text-primary-600 hover:text-primary-500">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleTwoFactorSubmit}>
                <div>
                  <Label htmlFor="twoFactorCode" className="text-primary-700">
                    Verification Code
                  </Label>
                  <p className="text-sm text-primary-600 mb-2">
                    We've sent a code to your email. Please enter it below.
                  </p>
                  <Input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    required
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="Enter verification code"
                    className="mt-1 text-center text-lg tracking-widest bg-primary-50 border-primary-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    maxLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
                  disabled={isTwoFactorLoading}
                >
                  {isTwoFactorLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-primary-600"
                  onClick={() => setShowTwoFactor(false)}
                >
                  Back to login
                </Button>
              </form>
            )}
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs text-primary-600">
            Bank Administrator?{" "}
            <Link href="/admin/login" className="font-medium text-primary-600 hover:text-primary-500">
              Access admin portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}