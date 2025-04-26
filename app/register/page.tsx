"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Color from "color";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    ssn: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    emailVerificationCode: "",
    username: "",
    password: "",
    confirmPassword: "",
    verificationMethod: "email",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
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
          console.error("Failed to fetch settings");
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const usStates = [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" },
    { value: "DC", label: "District of Columbia" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validateFirstStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    if (!formData.ssn.trim()) {
      newErrors.ssn = "Social Security Number is required";
    } else {
      const ssnDigits = formData.ssn.replace(/\D/g, "");
      if (ssnDigits.length !== 9) newErrors.ssn = "SSN must be 9 digits";
    }
    if (!formData.streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    else if (!/^\d{5}$/.test(formData.zipCode.replace(/\D/g, ""))) {
      newErrors.zipCode = "ZIP code must be 5 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSecondStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.emailVerificationCode.trim()) {
      newErrors.emailVerificationCode = "Email verification code is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateThirdStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 4) {
      newErrors.username = "Username must be at least 4 characters";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFirstStep = async () => {
    if (!validateFirstStep()) {
      console.log("Validation failed:", errors);
      return;
    }
    setIsLoading(true);
    try {
      // Check for duplicate email
      const duplicateCheckResponse = await fetch("/api/admin/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, username: "" }),
      });
      const duplicateData = await duplicateCheckResponse.json();
      if (!duplicateCheckResponse.ok) {
        setErrors({ email: "This email is already registered. Please use a different email." });
        setIsLoading(false);
        return;
      }

      console.log("Sending request to /api/register");
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          ssn: formData.ssn,
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          step: "requestCode",
        }),
      });
      const data = await response.json();
      console.log("API response:", data);
      if (!response.ok) {
        setErrors({ form: data.error || "Failed to send verification code" });
        setIsLoading(false);
        return;
      }
      console.log("Setting pendingUserId and advancing to step 2");
      setPendingUserId(data.pendingUserId);
      setStep(2);
    } catch (error: any) {
      console.error("Unexpected error in handleFirstStep:", error);
      setErrors({ form: `An unexpected error occurred: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecondStep = async () => {
    if (!validateSecondStep()) return;
    setIsLoading(true);
    try {
      console.log("Verifying email code");
      const emailResponse = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingUserId,
          code: formData.emailVerificationCode,
        }),
      });
      const emailData = await emailResponse.json();
      if (!emailResponse.ok) {
        setErrors({ emailVerificationCode: emailData.error || "Invalid email verification code" });
        setIsLoading(false);
        return;
      }
      console.log("Advancing to step 3");
      setStep(3);
    } catch (error: any) {
      console.error("Verification error:", error);
      setErrors({ form: `Verification failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleThirdStep = async () => {
    if (!validateThirdStep()) return;
    setIsLoading(true);
    try {
      // Check for duplicate username
      const duplicateCheckResponse = await fetch("/api/admin/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", username: formData.username }),
      });
      const duplicateData = await duplicateCheckResponse.json();
      if (!duplicateCheckResponse.ok) {
        setErrors({ username: "This username is already taken. Please choose a different username." });
        setIsLoading(false);
        return;
      }

      console.log("Completing registration");
      const response = await fetch("/api/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingUserId,
          username: formData.username,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors({ form: data.error || "Failed to complete registration" });
        setIsLoading(false);
        return;
      }
      console.log("Registration successful");
      router.push("/registration-success");
    } catch (error: any) {
      console.error("Registration error:", error);
      setErrors({ form: `An unexpected error occurred: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    console.log("handleNextStep called, current step:", step);
    if (step === 1) handleFirstStep();
    else if (step === 2) handleSecondStep();
    else if (step === 3) handleThirdStep();
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
    console.log("handlePrevStep called, new step:", step - 1);
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      // Check for duplicate email again before resending
      const duplicateCheckResponse = await fetch("/api/admin/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, username: "" }),
      });
      const duplicateData = await duplicateCheckResponse.json();
      if (!duplicateCheckResponse.ok) {
        setErrors({ email: "This email is already registered. Please use a different email." });
        setIsLoading(false);
        return;
      }

      console.log("Resending verification code");
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          ssn: formData.ssn,
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          step: "requestCode",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors({ form: data.error || "Failed to resend verification code" });
        setIsLoading(false);
        return;
      }
      alert("Verification code resent successfully");
      setPendingUserId(data.pendingUserId);
    } catch (error: any) {
      console.error("Resend code error:", error);
      setErrors({ form: `Failed to resend code: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, "");
    let formatted = "";
    if (digits.length > 0) {
      formatted += digits.substring(0, Math.min(3, digits.length));
      if (digits.length > 3) formatted += "-" + digits.substring(3, Math.min(5, digits.length));
      if (digits.length > 5) formatted += "-" + digits.substring(5, Math.min(9, digits.length));
    }
    return formatted;
  };

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatSSN(value);
    setFormData({ ...formData, ssn: formattedValue });
    if (errors.ssn) setErrors({ ...errors, ssn: "" });
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const digits = value.replace(/\D/g, "").substring(0, 5);
    setFormData({ ...formData, zipCode: digits });
    if (errors.zipCode) setErrors({ ...errors, zipCode: "" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-10 w-72 h-72 bg-secondary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-20 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
        {settings?.logoUrl ? (
  <img
    src={settings.logoUrl}
    alt="Site Logo"
    className="h-16 w-auto mx-auto drop-shadow-md"
  />
) : (
  <img
    src="/zelle-logo.svg"
    alt="Zelle"
    className="h-16 w-auto mx-auto drop-shadow-md"
  />
)}
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-primary-700">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-secondary-600 hover:text-secondary-500 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
        {errors.form && (
          <Alert variant="destructive" className="bg-red-50 border border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.form}</AlertDescription>
          </Alert>
        )}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute left-0 top-1/3 h-0.5 w-full bg-gradient-to-r from-primary-200 via-secondary-200 to-primary-200"></div>
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full ${step >= 1 ? "bg-gradient-to-r from-primary-600 to-secondary-600" : "bg-gray-200"} text-white flex items-center justify-center h-10 w-10 text-sm shadow-md`}
                >
                  1
                </div>
                <div className="text-xs mt-1 font-medium text-primary-700">Personal Info</div>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full ${step >= 2 ? "bg-gradient-to-r from-primary-600 to-secondary-600" : "bg-gray-200"} text-white flex items-center justify-center h-10 w-10 text-sm shadow-md`}
                >
                  2
                </div>
                <div className="text-xs mt-1 font-medium text-primary-700">Verification</div>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full ${step >= 3 ? "bg-gradient-to-r from-primary-600 to-secondary-600" : "bg-gray-200"} text-white flex items-center justify-center h-10 w-10 text-sm shadow-md`}
                >
                  3
                </div>
                <div className="text-xs mt-1 font-medium text-primary-700">Account Setup</div>
              </div>
            </div>
          </div>
          <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
            {step === 1 && (
              <div className="space-y-4 backdrop-blur-sm bg-white/70 p-6 rounded-xl shadow-xl border border-primary-100">
                <div>
                  <Label htmlFor="fullName" className="text-primary-800 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`${errors.fullName ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  />
                  {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <Label htmlFor="email" className="text-primary-800 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className={`${errors.email ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className="text-primary-800 font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your 10-digit phone number (e.g., 3001234567)"
                    className={`${errors.phone ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <Label htmlFor="ssn" className="text-primary-800 font-medium">
                    Social Security Number (SSN)
                  </Label>
                  <Input
                    id="ssn"
                    name="ssn"
                    type="text"
                    required
                    value={formData.ssn}
                    onChange={handleSSNChange}
                    placeholder="XXX-XX-XXXX"
                    className={`${errors.ssn ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    maxLength={11}
                  />
                  {errors.ssn && <p className="text-sm text-red-500 mt-1">{errors.ssn}</p>}
                  <p className="text-xs text-primary-600 mt-1">Your SSN is securely encrypted and stored</p>
                </div>
                <div>
                  <Label htmlFor="streetAddress" className="text-primary-800 font-medium">
                    Street Address
                  </Label>
                  <Input
                    id="streetAddress"
                    name="streetAddress"
                    type="text"
                    required
                    value={formData.streetAddress}
                    onChange={handleChange}
                    placeholder="Enter your street address"
                    className={`${errors.streetAddress ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  />
                  {errors.streetAddress && <p className="text-sm text-red-500 mt-1">{errors.streetAddress}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-primary-800 font-medium">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter your city"
                      className={`${errors.city ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    />
                    {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-primary-800 font-medium">
                      State
                    </Label>
                    <Select value={formData.state} onValueChange={(value) => handleSelectChange(value, "state")}>
                      <SelectTrigger
                        id="state"
                        className={`${errors.state ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                      >
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {usStates.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="zipCode" className="text-primary-800 font-medium">
                    ZIP Code
                  </Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={handleZipChange}
                    placeholder="Enter 5-digit ZIP code"
                    className={`${errors.zipCode ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    maxLength={5}
                  />
                  {errors.zipCode && <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>}
                </div>
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  onClick={handleNextStep}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4 backdrop-blur-sm bg-white/70 p-6 rounded-xl shadow-xl border border-primary-100">
                <div>
                  <Alert className="bg-primary-50 border-primary-200 text-primary-700">
                    <AlertDescription>
                      A verification code has been sent to your email.
                    </AlertDescription>
                  </Alert>
                </div>
                <div>
                  <Label htmlFor="emailVerificationCode" className="text-primary-800 font-medium">
                    Email Verification Code
                  </Label>
                  <Input
                    id="emailVerificationCode"
                    name="emailVerificationCode"
                    type="text"
                    required
                    value={formData.emailVerificationCode}
                    onChange={handleChange}
                    placeholder="Enter email verification code"
                    className={`${errors.emailVerificationCode ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  />
                  {errors.emailVerificationCode && (
                    <p className="mt-1 text-sm text-red-500">{errors.emailVerificationCode}</p>
                  )}
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-secondary-600 hover:text-secondary-500 transition-colors"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Didn't receive code? Resend"}
                  </button>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
                    onClick={handlePrevStep}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                    onClick={handleNextStep}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4 backdrop-blur-sm bg-white/70 p-6 rounded-xl shadow-xl border border-primary-100">
                <div>
                  <Label htmlFor="username" className="text-primary-800 font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    className={`${errors.username ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                  />
                  {errors.username && <p className="text-sm text-red-500 mt-1">{errors.username}</p>}
                </div>
                <div>
                  <Label htmlFor="password" className="text-primary-800 font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className={`${errors.password ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-500 hover:text-primary-700 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-primary-800 font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`${errors.confirmPassword ? "border-red-500" : "border-primary-200"} mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-10`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-500 hover:text-primary-700 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>
                <div>
                  <Label htmlFor="verificationMethod" className="text-primary-800 font-medium">
                    Preferred 2FA Method
                  </Label>
                  <Select
                    value={formData.verificationMethod}
                    onValueChange={(value) => handleSelectChange(value, "verificationMethod")}
                  >
                    <SelectTrigger
                      id="verificationMethod"
                      className="border-primary-200 mt-1 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    >
                      <SelectValue placeholder="Select verification method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
                    onClick={handlePrevStep}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                    onClick={handleNextStep}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-primary-700">
                By creating an account, you agree to our{" "}
                <Link href="/terms-of-services" className="font-medium text-secondary-600 hover:text-secondary-500 transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="privacy-policy" className="font-medium text-secondary-600 hover:text-secondary-500 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}