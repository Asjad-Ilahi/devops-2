"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Color from "color";
import { ArrowLeft, Check, Key, Mail, Shield, User, AlertCircle, Phone, Edit2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Interface for Colors
interface Colors {
  primaryColor: string;
  secondaryColor: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal" | "transfer" | "payment" | "fee" | "interest" | "refund";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
  category: string;
  accountType: "checking" | "savings" | "crypto";
  cryptoAmount?: number;
  cryptoPrice?: number;
}

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phoneNumber: string;
  checkingAccountNumber: string;
  checkingBalance: number;
  savingsAccountNumber: string;
  savingsBalance: number;
  cryptoWalletNumber: string;
  cryptoBalance: number;
  status: "pending" | "active" | "suspended";
  twoFactorEnabled: boolean;
  lastLogin: string;
  createdAt: string;
}

export default function UserManagementPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const searchParams = useSearchParams();

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const from = searchParams.get("from");

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    username: "",
    phoneNumber: "",
  });
  const backLink = from === "dashboard" ? "/admin/dashboard" : "/admin/users"

  // Reset password dialog
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 2FA dialog
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);

  // Add transaction dialog
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState<{
    type: Transaction["type"];
    amount: string;
    description: string;
    accountType?: "checking" | "savings" | "crypto";
    currencyType?: "fiat" | "crypto";
  }>({
    type: "deposit",
    amount: "",
    description: "",
    accountType: "checking",
    currencyType: "fiat",
  });

  // Colors state
  const [colors, setColors] = useState<Colors | null>(null);

  // Fetch colors and set CSS custom properties
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("/api/colors");
        if (!response.ok) throw new Error("Failed to fetch colors");
        const data: Colors = await response.json();
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
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, []);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user data
        const userResponse = await fetch(`/api/admin/users/${userId}`, {
          method: "GET",
          credentials: "include",
        });
        if (!userResponse.ok) {
          const data = await userResponse.json();
          throw new Error(data.error || "Failed to fetch user");
        }
        const { user: userData } = await userResponse.json();
        if (!userData) {
          throw new Error("No user data returned");
        }
        const formattedUser: User = {
          id: userData.id,
          name: userData.name || userData.fullName || "Unknown",
          username: userData.username || "N/A",
          email: userData.email || "N/A",
          phoneNumber: userData.phoneNumber || userData.phone || "N/A",
          checkingAccountNumber: userData.checkingAccountNumber || userData.accountNumber || "N/A",
          checkingBalance: userData.checkingBalance || userData.balance || 0,
          savingsAccountNumber: userData.savingsNumber || "N/A",
          savingsBalance: userData.savingsBalance || 0,
          cryptoWalletNumber: userData.cryptoNumber || "N/A",
          cryptoBalance: userData.cryptoBalance || 0,
          status: userData.status || "pending",
          twoFactorEnabled: userData.twoFactorEnabled || false,
          lastLogin: userData.lastLogin !== "N/A" ? new Date(userData.lastLogin).toLocaleString() : "N/A",
          createdAt: userData.createdAt !== "N/A" ? new Date(userData.createdAt).toLocaleDateString() : "N/A",
        };
        setUser(formattedUser);
        setProfileForm({
          name: formattedUser.name,
          email: formattedUser.email,
          username: formattedUser.username,
          phoneNumber: formattedUser.phoneNumber,
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load user data";
        setError(errorMessage);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
  };

  const handleProfileUpdate = async () => {
    setError(null);
    setSuccess(null);
    if (!profileForm.name || !profileForm.email || !profileForm.username || !profileForm.phoneNumber) {
      setError("All fields are required");
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: profileForm.name,
          email: profileForm.email,
          username: profileForm.username,
          phone: profileForm.phoneNumber,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }
      const { user: updatedUser } = await response.json();
      setUser((prev) => ({
        ...prev!,
        name: updatedUser.fullName,
        email: updatedUser.email,
        username: updatedUser.username,
        phoneNumber: updatedUser.phone,
      }));
      setSuccess("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
    }
  };

  const handlePasswordReset = async () => {
    setPasswordError(null);
    if (!newPassword) {
      setPasswordError("Password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to reset password");
      }
      setSuccess("Password has been reset successfully");
      setIsResetPasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reset password";
      setPasswordError(errorMessage);
    }
  };

  const handle2FAToggle = async (enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/2fa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ twoFactorEnabled: enabled }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update 2FA settings");
      }
      setUser((prev) => ({ ...prev!, twoFactorEnabled: enabled }));
      setSuccess(`Two-factor authentication ${enabled ? "enabled" : "reset"} successfully`);
      setIs2FADialogOpen(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update 2FA settings";
      setError(errorMessage);
    }
  };

  const handleAddTransaction = async () => {
    setError(null);
    if (!newTransaction.amount || !newTransaction.description) {
      setError("Please fill in all fields");
      return;
    }
    const amount = Number.parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (["deposit", "withdrawal"].includes(newTransaction.type)) {
      if (!newTransaction.currencyType) {
        setError("Please select a currency type");
        return;
      }
      if (newTransaction.currencyType === "fiat") {
        if (!newTransaction.accountType) {
          setError("Please select an account type");
          return;
        }
        // Check for sufficient balance for withdrawal
        if (newTransaction.type === "withdrawal" && user) {
          const withdrawalAmount = amount;
          if (newTransaction.accountType === "checking" && user.checkingBalance < withdrawalAmount) {
            setError(`Insufficient funds in checking account. Available: $${user.checkingBalance.toFixed(2)}`);
            return;
          } else if (newTransaction.accountType === "savings" && user.savingsBalance < withdrawalAmount) {
            setError(`Insufficient funds in savings account. Available: $${user.savingsBalance.toFixed(2)}`);
            return;
          }
        }
        try {
          const response = await fetch(`/api/admin/users/${userId}/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              type: newTransaction.type,
              amount: newTransaction.type === "withdrawal" ? -amount : amount,
              description: newTransaction.description,
              category: "admin",
              accountType: newTransaction.accountType,
            }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to add transaction");
          }
          if (newTransaction.accountType === "checking") {
            setUser((prev) => ({
              ...prev!,
              checkingBalance: prev!.checkingBalance + (newTransaction.type === "withdrawal" ? -amount : amount),
            }));
          } else if (newTransaction.accountType === "savings") {
            setUser((prev) => ({
              ...prev!,
              savingsBalance: prev!.savingsBalance + (newTransaction.type === "withdrawal" ? -amount : amount),
            }));
          }
          setSuccess("Transaction added successfully");
          setNewTransaction({ type: "deposit", amount: "", description: "", accountType: "checking", currencyType: "fiat" });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to add transaction";
          setError(errorMessage);
        }
      } else if (newTransaction.currencyType === "crypto") {
        if (newTransaction.type === "withdrawal" && user) {
          if (user.cryptoBalance < amount) {
            setError(`Insufficient crypto balance. Available: ${user.cryptoBalance.toFixed(8)} BTC`);
            return;
          }
        }
        try {
          const response = await fetch(`/api/admin/users/${userId}/transactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              type: newTransaction.type,
              amount: 0, // Added to satisfy potential server requirement
              cryptoAmount: newTransaction.type === "withdrawal" ? -amount : amount,
              description: newTransaction.description,
              category: "admin",
              accountType: "crypto",
            }),
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Failed to add transaction");
          }
          setUser((prev) => ({
            ...prev!,
            cryptoBalance: prev!.cryptoBalance + (newTransaction.type === "withdrawal" ? -amount : amount),
          }));
          setSuccess("Transaction added successfully");
          setNewTransaction({ type: "deposit", amount: "", description: "", accountType: "checking", currencyType: "fiat" });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to add transaction";
          setError(errorMessage);
        }
      }
    } else {
      // Handle other transaction types (transfer, payment, etc.)
      // ... (existing code)
    }
  };

  // Map user status to badge variant
  const getBadgeVariant = (status: User["status"]): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "suspended":
        return "destructive";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-primary-900">User Not Found</h2>
          <p className="mt-2 text-primary-600">The requested user could not be found.</p>
          <Button
            asChild
            className="mt-6 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
          >
            <Link href="/admin/users">Back to Users</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 bg-gradient-to-br from-primary-50 to-secondary-50 min-h-screen">
      <div className="mb-6">
        <Button
          variant="ghost"
          asChild
          className="p-0 mb-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100 transition-colors"
        >
          <Link href={backLink}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
          User Management
        </h1>
      </div>

      {success && (
        <Alert className="mb-6 bg-green-50 border border-green-200 text-green-800">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-50 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-1 backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-primary-900">User Profile</CardTitle>
            <CardDescription className="text-primary-600">Manage user information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <Avatar className="h-24 w-24 mb-4 border-4 border-primary-100">
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                  {user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="text-xl font-bold text-primary-900">{user.name}</h3>
                <p className="text-primary-600">{user.username}</p>
                <div className="flex justify-center mt-2">
                  <Badge
                    variant={getBadgeVariant(user.status)}
                    className={
                      user.status === "active"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : user.status === "pending"
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-red-100 text-red-800 border-red-200"
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-primary-100">
                <span className="text-primary-600">Checking #:</span>
                <span className="font-mono text-primary-900">{user.checkingAccountNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-primary-100">
                <span className="text-primary-600">Checking Balance:</span>
                <span className="font-bold text-primary-900">${user.checkingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-primary-100">
                <span className="text-primary-600">Savings #:</span>
                <span className="font-mono text-primary-900">{user.savingsAccountNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-primary-100">
                <span className="text-primary-600">Savings Balance:</span>
                <span className="font-bold text-primary-900">${user.savingsBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-primary-100">
                <span className="text-primary-600">Crypto Wallet #:</span>
                <span className="font-mono text-primary-900">{user.cryptoWalletNumber}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-primary-100">
                <span className="text-primary-600">Crypto Balance:</span>
                <span className="font-bold text-primary-900">{user.cryptoBalance.toFixed(8)} BTC</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-primary-100">
                <span className="text-primary-600">Created:</span>
                <span className="text-primary-900">{user.createdAt}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-primary-100">
                <span className="text-primary-600">Last Login:</span>
                <span className="text-primary-900">{user.lastLogin}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-primary-100">
                <span className="text-primary-600">2FA Status:</span>
                <Badge
                  variant={user.twoFactorEnabled ? "outline" : "secondary"}
                  className={user.twoFactorEnabled ? "bg-green-50 text-green-600 border-green-200" : ""}
                >
                  {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsResetPasswordOpen(true)}
                className="justify-start bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
              >
                <Key className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              <Button
                variant="outline"
                onClick={() => setIs2FADialogOpen(true)}
                className="justify-start bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
              >
                <Shield className="mr-2 h-4 w-4" />
                Manage 2FA
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-primary-900">Account Details</CardTitle>
                <CardDescription className="text-primary-600">View and edit user account information</CardDescription>
              </div>
              {!isEditingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-primary-800">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-primary-800">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-primary-800">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={profileForm.username}
                    onChange={handleProfileChange}
                    className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-primary-800">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={profileForm.phoneNumber}
                    onChange={handleProfileChange}
                    className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileForm({
                        name: user.name,
                        email: user.email,
                        username: user.username,
                        phoneNumber: user.phoneNumber,
                      });
                    }}
                    className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProfileUpdate}
                    className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-primary-100">
                    <User className="h-4 w-4 text-primary-600" />
                    <Label className="text-primary-600">Full Name:</Label>
                    <span className="ml-auto text-primary-900">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-2 pb-2 border-b border-primary-100">
                    <Mail className="h-4 w-4 text-primary-600" />
                    <Label className="text-primary-600">Email:</Label>
                    <span className="ml-auto text-primary-900">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 pb-2 border-b border-primary-100">
                    <User className="h-4 w-4 text-primary-600" />
                    <Label className="text-primary-600">Username:</Label>
                    <span className="ml-auto text-primary-900">{user.username}</span>
                  </div>
                  <div className="flex items-center gap-2 pb-2 border-b border-primary-100">
                    <Phone className="h-4 w-4 text-primary-600" />
                    <Label className="text-primary-600">Phone:</Label>
                    <span className="ml-auto text-primary-900">{user.phoneNumber}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium text-primary-900">Add Transaction</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transactionType" className="text-primary-800">
                        Transaction Type
                      </Label>
                      <Select
                        value={newTransaction.type}
                        onValueChange={(value) => {
                          const newType = value as Transaction["type"];
                          setNewTransaction({
                            type: newType,
                            amount: "",
                            description: "",
                            accountType: ["deposit", "withdrawal"].includes(newType) ? "checking" : undefined,
                            currencyType: ["deposit", "withdrawal"].includes(newType) ? "fiat" : undefined,
                          });
                        }}
                      >
                        <SelectTrigger
                          id="transactionType"
                          className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        >
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="withdrawal">Withdrawal</SelectItem>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {["deposit", "withdrawal"].includes(newTransaction.type) && (
                      <div className="space-y-2">
                        <Label htmlFor="currencyType" className="text-primary-800">
                          Currency Type
                        </Label>
                        <Select
                          value={newTransaction.currencyType || ""}
                          onValueChange={(value) =>
                            setNewTransaction({ ...newTransaction, currencyType: value as "fiat" | "crypto" })
                          }
                        >
                          <SelectTrigger
                            id="currencyType"
                            className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                          >
                            <SelectValue placeholder="Select currency type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fiat">Fiat (USD)</SelectItem>
                            <SelectItem value="crypto">Crypto (BTC)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {newTransaction.currencyType === "fiat" && ["deposit", "withdrawal"].includes(newTransaction.type) && (
                      <div className="space-y-2">
                        <Label htmlFor="accountType" className="text-primary-800">
                          Account Type
                        </Label>
                        <Select
                          value={newTransaction.accountType || ""}
                          onValueChange={(value) =>
                            setNewTransaction({ ...newTransaction, accountType: value as "checking" | "savings" })
                          }
                        >
                          <SelectTrigger
                            id="accountType"
                            className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                          >
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-primary-800">
                        Amount ({newTransaction.currencyType === "crypto" ? "BTC" : "USD"})
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600">
                          {newTransaction.currencyType === "crypto" ? "BTC" : "$"}
                        </div>
                        <Input
                          id="amount"
                          type="number"
                          step={newTransaction.currencyType === "crypto" ? "0.00000001" : "0.01"}
                          className="pl-7 border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                          placeholder={newTransaction.currencyType === "crypto" ? "0.00000000" : "0.00"}
                          value={newTransaction.amount}
                          onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-primary-800">
                        Description
                      </Label>
                      <Input
                        id="description"
                        placeholder="Enter transaction description"
                        className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      />
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                      onClick={handleAddTransaction}
                    >
                      Add Transaction
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border border-primary-100">
          <DialogHeader>
            <DialogTitle className="text-primary-900">Reset User Password</DialogTitle>
            <DialogDescription className="text-primary-600">Create a new password for {user.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {passwordError && (
              <Alert variant="destructive" className="bg-red-50 border border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="title-primary-800">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-primary-800">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResetPasswordOpen(false);
                setNewPassword("");
                setConfirmPassword("");
                setPasswordError(null);
              }}
              className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordReset}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border border-primary-100">
          <DialogHeader>
            <DialogTitle className="text-primary-900">Two-Factor Authentication</DialogTitle>
            <DialogDescription className="text-primary-600">
              Manage two-factor authentication settings for {user.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="font-medium text-primary-900">2FA Status</h4>
                <p className="text-sm text-primary-600">
                  {user.twoFactorEnabled
                    ? "Two-factor authentication is currently enabled."
                    : "Two-factor authentication is currently disabled."}
                </p>
              </div>
              <Switch
                checked={user.twoFactorEnabled}
                onCheckedChange={(checked) => {
                  if (
                    !checked &&
                    !confirm(
                      "Are you sure you want to disable 2FA for this user? This will require them to set it up again."
                    )
                  ) {
                    return;
                  }
                  handle2FAToggle(checked);
                }}
              />
            </div>
            {user.twoFactorEnabled && (
              <Alert className="bg-amber-50 border border-amber-200 text-amber-800">
                <AlertDescription className="text-amber-800">
                  Resetting 2FA will require the user to set it up again during their next login.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIs2FADialogOpen(false)}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}