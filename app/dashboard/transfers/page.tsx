"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, BanknoteIcon as Bank, Send, Wallet, Search, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Color from "color";
import { RecaptchaVerifier, auth } from "@/firebase"; // Firebase imports
import { sendVerificationSMS } from "@/lib/email"; // SMS utility function

interface Account {
  name: string;
  number: string;
  fullNumber: string;
  balance: number;
  type: string;
  status: string;
  openedDate: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
}

interface Colors {
  primaryColor: string;
  secondaryColor: string;
}

interface RateLimit {
  attempts: number;
  lastAttempt: number;
}

function ZelleTransfer({ checkingBalance }: { checkingBalance: number }) {
  const [step, setStep] = useState<"select" | "amount" | "confirmation" | "verify" | "result" | "phone">("select");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" });
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  const [rateLimit, setRateLimit] = useState<RateLimit>({ attempts: 0, lastAttempt: 0 });
  const searchParams = useSearchParams();
  const [colors, setColors] = useState<Colors | null>(null);
  const recaptchaVerifierRef = useRef<any>(null);
  const confirmationResultRef = useRef<any>(null);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("/api/colors");
        if (response.ok) {
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
        } else {
          console.error("Failed to fetch colors");
        }
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, []);

  useEffect(() => {
    const storedContacts = localStorage.getItem("recentZelleContacts");
    const contacts = storedContacts ? JSON.parse(storedContacts) : [];
    setRecentContacts(contacts);
    const contactId = searchParams.get("contactId");
    if (contactId) {
      const contact = contacts.find((c: Contact) => c.id === contactId);
      if (contact) {
        setSelectedContact(contact);
        setContactType(contact.email ? "email" : "phone");
        setStep("amount");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (step === "verify" && !recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );
    }
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [step]);

  const checkRateLimit = () => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (now - rateLimit.lastAttempt > fiveMinutes) {
      setRateLimit({ attempts: 0, lastAttempt: now });
      return true;
    }
    if (rateLimit.attempts >= 3) {
      setError("Too many resend attempts. Please wait 5 minutes.");
      return false;
    }
    return true;
  };

  const filteredRecent = recentContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)
  );

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setContactType(contact.email ? "email" : "phone");
    setStep("amount");
  };

  const handleNewContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!newContact.name) {
      setError("Name is required");
      setIsLoading(false);
      return;
    }
    if (contactType === "email" && !newContact.email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }
    if (contactType === "phone" && !newContact.phone) {
      setError("Phone number is required");
      setIsLoading(false);
      return;
    }

    try {
      const value = contactType === "email" ? newContact.email : newContact.phone;
      const response = await fetch("/api/user/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactType, value }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to check recipient");
        setIsLoading(false);
        return;
      }
      if (!data.exists) {
        setError("Recipient not found in the system");
        setIsLoading(false);
        return;
      }

      const contact: Contact = {
        id: `new-${Date.now()}`,
        name: newContact.name,
        email: contactType === "email" ? value : "",
        phone: contactType === "phone" ? value : "",
        initials: newContact.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
      };
      setSelectedContact(contact);
      const updatedContacts = [contact, ...recentContacts].slice(0, 5);
      localStorage.setItem("recentZelleContacts", JSON.stringify(updatedContacts));
      setRecentContacts(updatedContacts);
      setStep("amount");
    } catch (error) {
      setError("An error occurred while checking the recipient");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError(null);
    setStep("confirmation");
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!userPhone || !/^\d{10}$/.test(userPhone)) {
      setError("Please enter a valid 10-digit phone number");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/update-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ phone: `+1${userPhone}` }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update phone number");
        setIsLoading(false);
        return;
      }
      setStep("confirmation");
    } catch (error) {
      setError("An error occurred while updating phone number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmation = async () => {
    setIsLoading(true);
    const transferAmount = Number.parseFloat(amount);
    if (transferAmount > checkingBalance) {
      setError(`Insufficient balance. Current balance: $${checkingBalance.toFixed(2)}`);
      setStep("amount");
      setIsLoading(false);
      return;
    }

    if (verificationMethod === "phone") {
      try {
        const response = await fetch("/api/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok || !data.phone) {
          setStep("phone");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        setError("Failed to fetch user profile");
        setIsLoading(false);
        return;
      }
    }

    try {
      const recipientValue = contactType === "email" ? selectedContact?.email : selectedContact?.phone;
      const response = await fetch("/api/transfer/zelle/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          recipient: { type: contactType, value: recipientValue },
          amount: transferAmount,
          memo,
          verificationMethod,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Transfer request failed");
        setIsLoading(false);
        return;
      }

      setVerificationMethod(data.verificationMethod || "email");
      if (data.verificationMethod === "phone") {
        try {
          const confirmationResult = await sendVerificationSMS(data.phone, recaptchaVerifierRef.current);
          confirmationResultRef.current = confirmationResult;
        } catch (error: any) {
          setError(error.code === "auth/too-many-requests" ? "Too many SMS attempts. Try again later." : "Failed to send SMS verification");
          setIsLoading(false);
          return;
        }
      }

      setStep("verify");
    } catch (error) {
      setError("An error occurred while requesting the transfer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!verificationCode) {
      setError("Please enter a verification code");
      setIsLoading(false);
      return;
    }

    try {
      if (verificationMethod === "phone") {
        try {
          await confirmationResultRef.current.confirm(verificationCode);
        } catch (error: any) {
          setError(error.code === "auth/invalid-verification-code" ? "Invalid SMS verification code" : "SMS verification failed");
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch("/api/transfer/zelle/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ verificationCode, verificationMethod }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      if (selectedContact) {
        const updatedContacts = recentContacts.filter(
          (c) => !(c.email === selectedContact.email && c.phone === selectedContact.phone)
        );
        updatedContacts.unshift(selectedContact);
        const limitedContacts = updatedContacts.slice(0, 5);
        setRecentContacts(limitedContacts);
        localStorage.setItem("recentZelleContacts", JSON.stringify(limitedContacts));
      }

      setStep("result");
    } catch (error) {
      setError("An error occurred during verification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!checkRateLimit()) return;
    setIsLoading(true);
    setError(null);

    try {
      const recipientValue = contactType === "email" ? selectedContact?.email : selectedContact?.phone;
      const response = await fetch("/api/transfer/zelle/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ recipient: { type: contactType, value: recipientValue }, verificationMethod }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to resend code");
        setIsLoading(false);
        return;
      }
      if (verificationMethod === "phone") {
        try {
          const confirmationResult = await sendVerificationSMS(data.phone, recaptchaVerifierRef.current);
          confirmationResultRef.current = confirmationResult;
        } catch (error: any) {
          setError(error.code === "auth/too-many-requests" ? "Too many SMS attempts. Try again later." : "Failed to resend SMS");
          setIsLoading(false);
          return;
        }
      }
      setVerificationCode("");
      setRateLimit((prev) => ({ attempts: prev.attempts + 1, lastAttempt: Date.now() }));
    } catch (error) {
      setError("An error occurred while resending the code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep("select");
    setSelectedContact(null);
    setAmount("");
    setMemo("");
    setVerificationCode("");
    setUserPhone("");
    setError(null);
    setVerificationMethod("email");
    setRateLimit({ attempts: 0, lastAttempt: 0 });
  };

  const renderSelectContactStep = () => (
    <div className="space-y-6">
      <Tabs defaultValue="recent">
        <TabsList className="grid w-full grid-cols-2 bg-primary-100">
          <TabsTrigger value="recent" className="text-primary-700">Recent</TabsTrigger>
          <TabsTrigger value="new" className="text-primary-700">New Recipient</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
            <Input
              type="search"
              placeholder="Search recent recipients..."
              className="pl-8 border-primary-200 focus:ring-primary-500 bg-white/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {filteredRecent.length > 0 ? (
            <div className="space-y-2">
              {filteredRecent.map((contact) => (
                <Button
                  key={contact.id}
                  variant="outline"
                  className="w-full justify-start h-auto py-3 border-primary-200 hover:bg-primary-50 text-primary-700"
                  onClick={() => handleContactSelect(contact)}
                >
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback className="bg-primary-100 text-primary-700">{contact.initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-medium">{contact.name}</div>
                    <div className="text-sm text-primary-600">{contact.email || contact.phone}</div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-primary-600">No recent recipients yet</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="new" className="mt-4">
          <form onSubmit={handleNewContactSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-primary-800 font-medium">Name</Label>
              <Input
                id="name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Enter recipient's name"
                className="border-primary-200 focus:ring-primary-500 bg-white/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-primary-800 font-medium">Contact Method</Label>
                <div className="flex border rounded-md overflow-hidden border-primary-200">
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm ${contactType === "email" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`}
                    onClick={() => setContactType("email")}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm ${contactType === "phone" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`}
                    onClick={() => setContactType("phone")}
                  >
                    Phone
                  </button>
                </div>
              </div>
              {contactType === "email" && (
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="Enter email address"
                  className="border-primary-200 focus:ring-primary-500 bg-white/50"
                />
              )}
              {contactType === "phone" && (
                <Input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="border-primary-200 focus:ring-primary-500 bg-white/50"
                />
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderAmountStep = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary-100 text-primary-700">{selectedContact?.initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-primary-900">{selectedContact?.name}</div>
          <div className="text-sm text-primary-600">
            {contactType === "email" ? selectedContact?.email : selectedContact?.phone}
          </div>
        </div>
      </div>
      <form onSubmit={handleAmountSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-primary-800 font-medium">
            Amount (Balance: ${checkingBalance.toFixed(2)})
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-700">$</div>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              className="pl-7 border-primary-200 focus:ring-primary-500 bg-white/50"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="memo" className="text-primary-800 font-medium">Memo (Optional)</Label>
          <Input
            id="memo"
            placeholder="What's this for?"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="border-primary-200 focus:ring-primary-500 bg-white/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-primary-800 font-medium">Verification Method</Label>
          <div className="flex border rounded-md overflow-hidden border-primary-200">
            <button
              type="button"
              className={`px-3 py-1 text-sm ${verificationMethod === "email" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`}
              onClick={() => setVerificationMethod("email")}
            >
              Email
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm ${verificationMethod === "phone" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`}
              onClick={() => setVerificationMethod("phone")}
            >
              Phone
            </button>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
            onClick={() => setStep("select")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );

  const renderPhoneStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-primary-900">Enter Phone Number</h3>
        <p className="text-sm text-primary-600">Please provide your phone number for SMS verification</p>
      </div>
      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="userPhone" className="text-primary-800 font-medium">Phone Number</Label>
          <Input
            id="userPhone"
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={userPhone}
            onChange={(e) => setUserPhone(e.target.value)}
            maxLength={10}
            className="border-primary-200 focus:ring-primary-500 bg-white/50"
          />
        </div>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
            onClick={() => setStep("amount")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-primary-900">Confirm Transfer</h3>
          <p className="text-sm text-primary-600">You are about to send money via Zelle</p>
        </div>
        <div className="border border-primary-100 rounded-lg p-4 space-y-4 bg-white/60">
          <div className="flex items-center justify-between">
            <span className="text-primary-600">To:</span>
            <span className="font-medium text-primary-900">{selectedContact?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Email/Phone:</span>
            <span className="text-primary-700">
              {contactType === "email" ? selectedContact?.email : selectedContact?.phone}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Amount:</span>
            <span className="font-bold text-primary-900">${Number.parseFloat(amount).toFixed(2)}</span>
          </div>
          {memo && (
            <div className="flex items-center justify-between">
              <span className="text-primary-600">Memo:</span>
              <span className="text-primary-700">{memo}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Verification:</span>
            <span className="text-primary-700">{verificationMethod === "email" ? "Email" : "SMS"}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
            onClick={() => setStep("amount")}
          >
            Back
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
            onClick={handleConfirmation}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-primary-900">Verify Transfer</h3>
        <p className="text-sm text-primary-600">
          Enter the 6-digit code sent to your {verificationMethod === "email" ? "email" : "phone"}
        </p>
      </div>
      <div id="recaptcha-container" />
      <form onSubmit={handleVerify} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="verificationCode" className="text-primary-800 font-medium">Verification Code</Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="border-primary-200 focus:ring-primary-500 bg-white/50"
          />
        </div>
        <Button
          type="button"
          variant="link"
          className="w-full text-primary-600 hover:text-primary-700"
          onClick={handleResendCode}
          disabled={isLoading || rateLimit.attempts >= 3}
        >
          Resend Code
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
            onClick={() => setStep("confirmation")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
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
        </div>
      </form>
    </div>
  );

  const renderResultStep = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-primary-900">Transfer Successful!</h3>
      <p className="text-primary-700">
        You've sent ${Number.parseFloat(amount).toFixed(2)} to {selectedContact?.name}
      </p>
      <div className="border border-primary-100 rounded-lg p-4 space-y-2 text-left bg-white/60">
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Amount:</span>
          <span className="font-bold text-primary-900">${Number.parseFloat(amount).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">To:</span>
          <span className="text-primary-700">{selectedContact?.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">{contactType === "email" ? "Email:" : "Phone:"}</span>
          <span className="text-primary-700">
            {contactType === "email" ? selectedContact?.email : selectedContact?.phone}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Date:</span>
          <span className="text-primary-700">{new Date().toLocaleDateString()}</span>
        </div>
        {memo && (
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Memo:</span>
            <span className="text-primary-700">{memo}</span>
          </div>
        )}
      </div>
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
          onClick={handleStartOver}
        >
          New Transfer
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
          asChild
        >
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-primary-900">
          {step === "select"
            ? "Select Recipient"
            : step === "amount"
            ? "Enter Amount"
            : step === "phone"
            ? "Enter Phone Number"
            : step === "confirmation"
            ? "Confirm Transfer"
            : step === "verify"
            ? "Verify Transfer"
            : "Transfer Status"}
        </CardTitle>
        <CardDescription className="text-primary-600">
          {step === "select"
            ? "Choose who you want to send money to"
            : step === "amount"
            ? "Enter the amount to send"
            : step === "phone"
            ? "Provide your phone number for SMS verification"
            : step === "confirmation"
            ? "Review and confirm your transfer"
            : step === "verify"
            ? "Enter verification code to complete transfer"
            : "Your transfer has been processed"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "select" && renderSelectContactStep()}
        {step === "amount" && renderAmountStep()}
        {step === "phone" && renderPhoneStep()}
        {step === "confirmation" && renderConfirmationStep()}
        {step === "verify" && renderVerifyStep()}
        {step === "result" && renderResultStep()}
      </CardContent>
    </Card>
  );
}

function TransferContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") || "internal";
  const [transferType, setTransferType] = useState<"internal" | "external" | "zelle">(
    initialType as "internal" | "external" | "zelle"
  );
  const [internalFrom, setInternalFrom] = useState("");
  const [internalTo, setInternalTo] = useState("");
  const [internalAmount, setInternalAmount] = useState("");
  const [internalMemo, setInternalMemo] = useState("");
  const [internalStep, setInternalStep] = useState<"form" | "verify" | "result" | "phone">("form");
  const [internalVerificationCode, setInternalVerificationCode] = useState("");
  const [internalVerificationMethod, setInternalVerificationMethod] = useState<"email" | "phone">("email");
  const [internalUserPhone, setInternalUserPhone] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [externalStep, setExternalStep] = useState<"form" | "verify" | "result" | "phone">("form");
  const [externalAccount, setExternalAccount] = useState("");
  const [externalBankName, setExternalBankName] = useState("");
  const [externalAccountNumber, setExternalAccountNumber] = useState("");
  const [externalAmount, setExternalAmount] = useState("");
  const [externalMemo, setExternalMemo] = useState("");
  const [externalVerificationCode, setExternalVerificationCode] = useState("");
  const [externalStreet, setExternalStreet] = useState("");
  const [externalCity, setExternalCity] = useState("");
  const [externalState, setExternalState] = useState("");
  const [externalZip, setExternalZip] = useState("");
  const [externalPhone, setExternalPhone] = useState("");
  const [externalVerificationMethod, setExternalVerificationMethod] = useState<"email" | "phone">("email");
  const [externalUserPhone, setExternalUserPhone] = useState("");
  const [internalRateLimit, setInternalRateLimit] = useState<RateLimit>({ attempts: 0, lastAttempt: 0 });
  const [externalRateLimit, setExternalRateLimit] = useState<RateLimit>({ attempts: 0, lastAttempt: 0 });
  const [colors, setColors] = useState<Colors | null>(null);
  const internalRecaptchaVerifierRef = useRef<any>(null);
  const internalConfirmationResultRef = useRef<any>(null);
  const externalRecaptchaVerifierRef = useRef<any>(null);
  const externalConfirmationResultRef = useRef<any>(null);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("/api/colors");
        if (response.ok) {
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
        } else {
          console.error("Failed to fetch colors");
        }
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to view accounts");
        return;
      }

      try {
        const response = await fetch("/api/accounts", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const newAccounts: Account[] = [
          {
            name: "Checking Account",
            number: data.checkingNumber?.slice(-4).padStart(12, "x") || "xxxx-xxxx-xxxx",
            fullNumber: data.checkingNumber || "Not Available",
            balance: data.checkingBalance || 0,
            type: "checking",
            status: "active",
            openedDate: data.openedDate || "N/A",
          },
          {
            name: "Savings Account",
            number: data.savingsNumber?.slice(-4).padStart(12, "x") || "xxxx-xxxx-xxxx",
            fullNumber: data.savingsNumber || "Not Available",
            balance: data.savingsBalance || 0,
            type: "savings",
            status: "active",
            openedDate: data.openedDate || "N/A",
          },
        ];

        setAccounts(newAccounts);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load accounts");
      }
    };

    fetchAccounts();
  }, []);

  useEffect(() => {
    if ((internalStep === "verify" || externalStep === "verify") && !internalRecaptchaVerifierRef.current) {
      internalRecaptchaVerifierRef.current = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );
      externalRecaptchaVerifierRef.current = internalRecaptchaVerifierRef.current;
    }
    return () => {
      if (internalRecaptchaVerifierRef.current) {
        internalRecaptchaVerifierRef.current.clear();
        internalRecaptchaVerifierRef.current = null;
      }
      if (externalRecaptchaVerifierRef.current) {
        externalRecaptchaVerifierRef.current.clear();
        externalRecaptchaVerifierRef.current = null;
      }
    };
  }, [internalStep, externalStep]);

  const checkRateLimit = (limit: RateLimit, setLimit: (limit: RateLimit) => void) => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (now - limit.lastAttempt > fiveMinutes) {
      setLimit({ attempts: 0, lastAttempt: now });
      return true;
    }
    if (limit.attempts >= 3) {
      setError("Too many resend attempts. Please wait 5 minutes.");
      return false;
    }
    return true;
  };

  const getBalance = (accountType: string): number => {
    const account = accounts.find((a) => a.type === accountType);
    return account ? account.balance : 0;
  };

  const handleInternalPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!internalUserPhone || !/^\d{10}$/.test(internalUserPhone)) {
      setError("Please enter a valid 10-digit phone number");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/update-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ phone: `+1${internalUserPhone}` }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update phone number");
        setIsLoading(false);
        return;
      }
      setInternalStep("form");
    } catch (error) {
      setError("An error occurred while updating phone number");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!internalFrom || !internalTo || !internalAmount) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (internalFrom === internalTo) {
      setError("Source and destination accounts cannot be the same");
      setIsLoading(false);
      return;
    }

    const transferAmount = Number.parseFloat(internalAmount);
    const sourceBalance = getBalance(internalFrom);
    if (transferAmount > sourceBalance) {
      setError(`Insufficient balance. Available: $${sourceBalance.toFixed(2)}`);
      setIsLoading(false);
      return;
    }

    if (internalVerificationMethod === "phone") {
      try {
        const response = await fetch("/api/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok || !data.phone) {
          setInternalStep("phone");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        setError("Failed to fetch user profile");
        setIsLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/transfer/internal/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: internalFrom,
          to: internalTo,
          amount: transferAmount,
          memo: internalMemo,
          verificationMethod: internalVerificationMethod,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Transfer request failed");
        setIsLoading(false);
        return;
      }

      setInternalVerificationMethod(data.verificationMethod || "email");
      if (data.verificationMethod === "phone") {
        try {
          const confirmationResult = await sendVerificationSMS(data.phone, internalRecaptchaVerifierRef.current);
          internalConfirmationResultRef.current = confirmationResult;
        } catch (error: any) {
          setError(error.code === "auth/too-many-requests" ? "Too many SMS attempts. Try again later." : "Failed to send SMS verification");
          setIsLoading(false);
          return;
        }
      }

      setInternalStep("verify");
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInternalVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!internalVerificationCode) {
      setError("Please enter a verification code");
      setIsLoading(false);
      return;
    }

    try {
      if (internalVerificationMethod === "phone") {
        try {
          await internalConfirmationResultRef.current.confirm(internalVerificationCode);
        } catch (error: any) {
          setError(error.code === "auth/invalid-verification-code" ? "Invalid SMS verification code" : "SMS verification failed");
          setIsLoading(false);
          return;
        }
      }

      const token = localStorage.getItem("token");
      const normalizedCode = internalVerificationCode.trim().toUpperCase();
      const response = await fetch("/api/transfer/internal/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verificationCode: normalizedCode,
          verificationMethod: internalVerificationMethod,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      const fetchResponse = await fetch("/api/accounts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const fetchData = await fetchResponse.json();
      setAccounts([
        {
          name: "Checking Account",
          number: fetchData.checkingNumber?.slice(-4).padStart(12, "x") || "xxxx-xxxx-xxxx",
          fullNumber: fetchData.checkingNumber || "Not Available",
          balance: fetchData.checkingBalance || 0,
          type: "checking",
          status: "active",
          openedDate: fetchData.openedDate || "N/A",
        },
        {
          name: "Savings Account",
          number: fetchData.savingsNumber?.slice(-4).padStart(12, "x") || "xxxx-xxxx-xxxx",
          fullNumber: fetchData.savingsNumber || "Not Available",
          balance: fetchData.savingsBalance || 0,
          type: "savings",
          status: "active",
          openedDate: fetchData.openedDate || "N/A",
        },
      ]);

      setInternalStep("result");
    } catch (error) {
      setError("An error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInternalResendCode = async () => {
    if (!checkRateLimit(internalRateLimit, setInternalRateLimit)) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/transfer/internal/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verificationMethod: internalVerificationMethod }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to resend code");
        setIsLoading(false);
        return;
      }
      if (internalVerificationMethod === "phone") {
        try {
          const confirmationResult = await sendVerificationSMS(data.phone, internalRecaptchaVerifierRef.current);
          internalConfirmationResultRef.current = confirmationResult;
        } catch (error: any) {
          setError(error.code === "auth/too-many-requests" ? "Too many SMS attempts. Try again later." : "Failed to resend SMS");
          setIsLoading(false);
          return;
        }
      }
      setInternalVerificationCode("");
      setInternalRateLimit((prev) => ({ attempts: prev.attempts + 1, lastAttempt: Date.now() }));
    } catch (error) {
      setError("An error occurred while resending the code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInternalReset = () => {
    setInternalStep("form");
    setInternalFrom("");
    setInternalTo("");
    setInternalAmount("");
    setInternalMemo("");
    setInternalVerificationCode("");
    setInternalVerificationMethod("email");
    setInternalUserPhone("");
    setError(null);
    setInternalRateLimit({ attempts: 0, lastAttempt: 0 });
  };

  const handleExternalPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!externalUserPhone || !/^\d{10}$/.test(externalUserPhone)) {
      setError("Please enter a valid 10-digit phone number");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/update-phone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ phone: `+1${externalUserPhone}` }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update phone number");
        setIsLoading(false);
        return;
      }
      setExternalStep("form");
    } catch (error) {
      setError("An error occurred while updating phone number");
    } finally {
      set-jsLoading(false);
    }
  };

  const handleExternalTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (
      !externalAccount ||
      !externalBankName ||
      !externalAccountNumber ||
      !externalAmount ||
      !externalStreet ||
      !externalCity ||
      !externalState ||
      !externalZip ||
      !externalPhone
    ) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }
    if (!/^\d{5}$/.test(externalZip)) {
      setError("Zip code must be exactly 5 digits");
      setIsLoading(false);
      return;
    }
    if (!/^\d{10}$/.test(externalPhone)) {
      setError("Phone number must be exactly 10 digits");
      setIsLoading(false);
      return;
    }

    const transferAmount = Number.parseFloat(externalAmount);
    const sourceBalance = getBalance(externalAccount);
    if (transferAmount > sourceBalance) {
      setError(`Insufficient balance. Available: $${sourceBalance.toFixed(2)}`);
      setIsLoading(false);
      return;
    }

    if (externalVerificationMethod === "phone") {
      try {
        const response = await fetch("/api/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (!response.ok || !data.phone) {
          setExternalStep("phone");
          setIsLoading(false);
          return;
        }
      } catch (error) {
        setError("Failed to fetch user profile");
        setIsLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/transfer/external/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from: externalAccount,
          amount: transferAmount,
          externalBankName,
          externalAccountNumber,
          externalStreet,
          externalCity,
          externalState,
          externalZip,
          externalPhone,
          memo: externalMemo,
          verificationMethod: externalVerificationMethod,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "External transfer request failed");
        setIsLoading(false);
        return;
      }

      setExternalVerificationMethod(data.verificationMethod || "email");
      if (data.verificationMethod === "phone") {
        try {
          const confirmationResult = await sendVerificationSMS(data.phone, externalRecaptchaVerifierRef.current);
          externalConfirmationResultRef.current = confirmationResult;
        } catch (error: any) {
          setError(error.code === "auth/too-many-requests" ? "Too many SMS attempts. Try again later." : "Failed to send SMS verification");
          setIsLoading(false);
          return;
        }
      }

      setExternalStep("verify");
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExternalVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!externalVerificationCode) {
      setError("Please enter a verification code");
      setIsLoading(false);
      return;
    }

    try {
      if (externalVerificationMethod === "phone") {
        try {
          await externalConfirmationResultRef.current.confirm(externalVerificationCode);
        } catch (error: any) {
          setError(error.code === "auth/invalid-verification-code" ? "Invalid SMS verification code" : "SMS verification failed");
          setIsLoading(false);
          return;
        }
      }

      const token = localStorage.getItem("token");
      const normalizedCode = externalVerificationCode.trim().toUpperCase();
      const response = await fetch("/api/transfer/external/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verificationCode: normalizedCode,
          verificationMethod: externalVerificationMethod,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }

      const fetchResponse = await fetch("/api/accounts", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const fetchData = await fetchResponse.json();
      setAccounts([
        {
          name: "Checking Account",
          number: fetchData.checkingNumber?.slice(-4).padStart(12, "x") || "xxxx-xxxx-xxxx",
          fullNumber: fetchData.checkingNumber || "Not Available",
          balance: fetchData.checkingBalance || 0,
          type: "checking",
          status: "active",
          openedDate: fetchData.openedDate || "N/A",
        },
        {
          name: "Savings Account",
          number: fetchData.savingsNumber?.slice(-4).padStart(12, "x") || "xxxx-xxxx-xxxx",
          fullNumber: fetchData.savingsNumber || "Not Available",
          balance: fetchData.savingsBalance || 0,
          type: "savings",
          status: "active",
          openedDate: fetchData.openedDate || "N/A",
        },
      ]);

      setExternalStep("result");
    } catch (error) {
      setError("An error occurred during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExternalResendCode = async () => {
    if (!checkRateLimit(externalRateLimit, setExternalRateLimit)) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/transfer/external/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verificationMethod: externalVerificationMethod }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to resend code");
        setIsLoading(false);
        return;
      }
      if (externalVerificationMethod === "phone") {
        try {
          const confirmationResult = await sendVerificationSMS(data.phone, externalRecaptchaVerifierRef.current);
          externalConfirmationResultRef.current = confirmationResult;
        } catch (error: any) {
          setError(error.code === "auth/too-many-requests" ? "Too many SMS attempts. Try again later." : "Failed to resend SMS");
          setIsLoading(false);
          return;
        }
      }
      setExternalVerificationCode("");
      setExternalRateLimit((prev) => ({ attempts: prev.attempts + 1, lastAttempt: Date.now() }));
    } catch (error) {
      setError("An error occurred while resending the code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExternalReset = () => {
    setExternalStep("form");
    setExternalAccount("");
    setExternalBankName("");
    setExternalAccountNumber("");
    setExternalAmount("");
    setExternalMemo("");
    setExternalVerificationCode("");
    setExternalStreet("");
    setExternalCity("");
    setExternalState("");
    setExternalZip("");
    setExternalPhone("");
    setExternalVerificationMethod("email");
    setExternalUserPhone("");
    setError(null);
    setExternalRateLimit({ attempts: 0, lastAttempt: 0 });
  };

  const renderInternalPhoneStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-primary-900">Enter Phone Number</h3>
        <p className="text-sm text-primary-600">Please provide your phone number for SMS verification</p>
      </div>
      <form onSubmit={handleInternalPhoneSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="internalUserPhone" className="text-primary-800 font-medium">Phone Number</Label>
          <Input
            id="internalUserPhone"
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={internalUserPhone}
            onChange={(e) => setInternalUserPhone(e.target.value)}
            maxLength={10}
            className="border-primary-200 focus:ring-primary-500 bg-white/50"
          />
        </div>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
            onClick={() => setInternalStep("form")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderInternalForm = () => (
    <form onSubmit={handleInternalTransfer} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="internalFrom" className="text-primary-800 font-medium">From Account</Label>
            <Select value={internalFrom} onValueChange={setInternalFrom}>
              <SelectTrigger id="internalFrom" className="border-primary-200 bg-white/50">
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking Account (xxxx-xxxx-4582)</SelectItem>
                <SelectItem value="savings">Savings Account (xxxx-xxxx-7891)</SelectItem>
              </SelectContent>
            </Select>
            {internalFrom && (
              <p className="text-sm text-primary-600">
                Available balance: ${getBalance(internalFrom).toFixed(2)}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="internalTo" className="text-primary-800 font-medium">To Account</Label>
            <Select value={internalTo} onValueChange={setInternalTo}>
              <SelectTrigger id="internalTo" className="border-primary-200 bg-white/50">
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking Account (xxxx-xxxx-4582)</SelectItem>
                <SelectItem value="savings">Savings Account (xxxx-xxxx-7891)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="internalAmount" className="text-primary-800 font-medium">Amount</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-700">$</div>
            <Input
              id="internalAmount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="pl-7 border-primary-200 focus:ring-primary-500 bg-white/50"
              value={internalAmount}
              onChange={(e) => setInternalAmount(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="internalMemo" className="text-primary-800 font-medium">Memo</Label>
          <Input
            id="internalMemo"
            placeholder="Add a note for this transfer"
            value={internalMemo}
            onChange={(e) => setInternalMemo(e.target.value)}
            className="border-primary-200 focus:ring-primary-500 bg-white/50"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-primary-800 font-medium">Verification Method</Label>
          <div className="flex border rounded-md overflow-hidden border-primary-200">
            <button
              type="button"
              className={`px-3 py-1 text-sm ${internalVerificationMethod === "email" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`}
              onClick={() => setInternalVerificationMethod("email")}
            >
              Email
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm ${internalVerificationMethod === "phone" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`}
              onClick={() => setInternalVerificationMethod("phone")}
            >
              Phone
            </button>
          </div>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  );

  const renderInternalVerify = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-primary-900">Verify Transfer</h3>
        <p className="text-sm text-primary-600">
          Enter the 6-digit code sent to your {internalVerificationMethod === "email" ? "email" : "phone"}
        </p>
      </div>
      <div id="recaptcha-container" />
      <form onSubmit={handleInternalVerify} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="internalVerificationCode" className="text-primary-800 font-medium">Verification Code</Label>
          <Input
            id="internalVerificationCode"
            type="text"
            placeholder="Enter 6-digit code"
            value={internalVerificationCode}
            onChange={(e) => setInternalVerificationCode(e.target.value)}
            maxLength={6}
            className="border-primary-200 focus:ring-primary-500 bg-white/50"
          />
        </div>
        <Button
          type="button"
          variant="link"
          className="w-full text-primary-600 hover:text-primary-700"
          onClick={handleInternalResendCode}
          disabled={isLoading || internalRateLimit.attempts >= 3}
        >
          Resend Code
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
            onClick={() => setInternalStep("form")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
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
        </div>
      </form>
    </div>
  );

  const renderInternalResult = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-primary-900">Transfer Successful!</h3>
      <p className="text-primary-700">
        You've transferred ${Number.parseFloat(internalAmount).toFixed(2)} from{" "}
        {internalFrom.charAt(0).toUpperCase() + internalFrom.slice(1)} to{" "}
        {internalTo.charAt(0).toUpperCase() + internalTo.slice(1)}
      </p>
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
          onClick={handleInternalReset}
        >
          New Transfer
        </Button>
        <Button
          className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
          asChild
        >
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );

  const renderExternalPhoneStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-primary-900">Enter Phone Number</h3>
        <p className="text-sm text-primary-600">Please provide your phone number for SMS verification</p>
      </div>
      <form onSubmit={handleExternalPhoneSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="externalUserPhone" className="text-primary-800 font-medium">Phone Number</Label>
          <Input
            id="externalUserPhone"
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={externalUserPhone}
            onChange={(e) => setExternalUserPhone(e.target.value)}
            maxLength={10}
            className="border-primary-200 focus:ring-primary-500 bg-white/50"
          />
        </div>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all"
            onClick={() => setExternalStep("form")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderExternalForm = () => (
    <form onSubmit={handleExternalTransfer} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="externalAccount" className="text-primary-800 font-medium">From Account</Label>
          <Select value={externalAccount} onValueChange={setExternalAccount}>
            <SelectTrigger id="externalAccount" className="border-primary-200 bg-white/50">
              <SelectValue placeholder="Select your account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Checking Account (xxxx-xxxx-4582)</SelectItem>
<SelectItem value="savings">Savings Account (xxxx-xxxx-7891)</SelectItem>
</SelectContent>
</Select>
{externalAccount && (

<p className="text-sm text-primary-600"> Available balance: ${getBalance(externalAccount).toFixed(2)} </p> )} </div> <div className="space-y-2"> <Label htmlFor="externalBankName" className="text-primary-800 font-medium">Bank Name</Label> <Input id="externalBankName" placeholder="Enter bank name" value={externalBankName} onChange={(e) => setExternalBankName(e.target.value)} className="border-primary-200 focus:ring-primary-500 bg-white/50" /> </div> <div className="space-y-2"> <Label htmlFor="externalAccountNumber" className="text-primary-800 font-medium">Account Number</Label> <Input id="externalAccountNumber" placeholder="Enter account number" value={externalAccountNumber} onChange={(e) => setExternalAccountNumber(e.target.value)} className="border-primary-200 focus:ring-primary-500 bg-white/50" /> </div> <div className="space-y-2"> <Label htmlFor="externalAmount" className="text-primary-800 font-medium">Amount</Label> <div className="relative"> <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-700">$</div> <Input id="externalAmount" type="number" min="0.01" step="0.01" placeholder="0.00" className="pl-7 border-primary-200 focus:ring-primary-500 bg-white/50" value={externalAmount} onChange={(e) => setExternalAmount(e.target.value)} /> </div> </div> <div className="space-y-2"> <Label htmlFor="externalStreet" className="text-primary-800 font-medium">Street Address</Label> <Input id="externalStreet" placeholder="Enter street address" value={externalStreet} onChange={(e) => setExternalStreet(e.target.value)} className="border-primary-200 focus:ring-primary-500 bg-white/50" /> </div> <div className="grid gap-4 sm:grid-cols-3"> <div className="space-y-2"> <Label htmlFor="externalCity" className="text-primary-800 font-medium">City</Label> <Input id="externalCity" placeholder="Enter city" value={externalCity} onChange={(e) => setExternalCity(e.target.value)} className="border-primary-200 focus:ring-primary-500 bg-white/50" /> </div> <div className="space-y-2"> <Label htmlFor="externalState" className="text-primary-800 font-medium">State</Label> <Input id="externalState" placeholder="Enter state" value={externalState} onChange={(e) => setExternalState(e.target.value)} className="border-primary-200 focus:ring-primary-500 bg-white/50" /> </div> <div className="space-y-2"> <Label htmlFor="externalZip" className="text-primary-800 font-medium">Zip Code</Label> <Input id="externalZip" placeholder="Enter zip code" value={externalZip} onChange={(e) => setExternalZip(e.target.value)} maxLength={5} className="border-primary-200 focus:ring-primary-500 bg-white/50" /> </div> </div> <div className="space-y-2"> <Label htmlFor="externalPhone" className="text-primary-800 font-medium">Phone Number</Label> <Input id="externalPhone" type="tel" placeholder="Enter 10-digit phone number" value={externalPhone} onChange={(e) => setExternalPhone(e.target.value)} maxLength={10} className="border-primary-200 focus:ring-primary-500 bg-white/50" /> </div> <div className="space-y-2"> <Label htmlFor="externalMemo" className="text-primary-800 font-medium">Memo (Optional)</Label> <Input id="externalMemo" placeholder="Add a note for this transfer" value={externalMemo} onChange={(e) => setExternalMemo(e.target.value)} className="border-primary-200 focus:ring-primary-500 bg-white/50" /> </div> <div className="space-y-2"> <Label className="text-primary-800 font-medium">Verification Method</Label> <div className="flex border rounded-md overflow-hidden border-primary-200"> <button type="button" className={`px-3 py-1 text-sm ${externalVerificationMethod === "email" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`} onClick={() => setExternalVerificationMethod("email")} > Email </button> <button type="button" className={`px-3 py-1 text-sm ${externalVerificationMethod === "phone" ? "bg-primary-600 text-white" : "bg-primary-50 text-primary-700"}`} onClick={() => setExternalVerificationMethod("phone")} > Phone </button> </div> </div> </div> <Button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all" disabled={isLoading} > {isLoading ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing... </> ) : ( "Continue" )} </Button> </form> );
const renderExternalVerify = () => (

<div className="space-y-6"> <div className="text-center"> <h3 className="text-lg font-medium text-primary-900">Verify Transfer</h3> <p className="text-sm text-primary-600"> Enter the 6-digit code sent to your {externalVerificationMethod === "email" ? "email" : "phone"} </p> </div> <div id="recaptcha-container" /> <form onSubmit={handleExternalVerify} className="space-y-4"> {error && ( <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800"> <AlertDescription>{error}</AlertDescription> </Alert> )} <div className="space-y-2"> <Label htmlFor="externalVerificationCode" className="text-primary-800 font-medium">Verification Code</Label> <Input id="externalVerificationCode" type="text" placeholder="Enter 6-digit code" value={externalVerificationCode} onChange={(e) => setExternalVerificationCode(e.target.value)} maxLength={6} className="border-primary-200 focus:ring-primary-500 bg-white/50" /> </div> <Button type="button" variant="link" className="w-full text-primary-600 hover:text-primary-700" onClick={handleExternalResendCode} disabled={isLoading || externalRateLimit.attempts >= 3} > Resend Code </Button> <div className="flex space-x-3"> <Button type="button" variant="outline" className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all" onClick={() => setExternalStep("form")} > Back </Button> <Button type="submit" className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all" disabled={isLoading} > {isLoading ? ( <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying... </> ) : ( "Verify" )} </Button> </div> </form> </div> );
const renderExternalResult = () => (

<div className="space-y-6 text-center"> <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"> <Check className="h-8 w-8 text-green-600" /> </div> <h3 className="text-xl font-bold text-primary-900">Transfer Successful!</h3> <p className="text-primary-700"> You've transferred ${Number.parseFloat(externalAmount).toFixed(2)} to {externalBankName} </p> <div className="border border-primary-100 rounded-lg p-4 space-y-2 text-left bg-white/60"> <div className="flex items-center justify-between"> <span className="text-primary-600">Amount:</span> <span className="font-bold text-primary-900">${Number.parseFloat(externalAmount).toFixed(2)}</span> </div> <div className="flex items-center justify-between"> <span className="text-primary-600">From:</span> <span className="text-primary-700"> {externalAccount.charAt(0).toUpperCase() + externalAccount.slice(1)} Account </span> </div> <div className="flex items-center justify-between"> <span className="text-primary-600">Bank:</span> <span className="text-primary-700">{externalBankName}</span> </div> <div className="flex items-center justify-between"> <span className="text-primary-600">Account Number:</span> <span className="text-primary-700">xxxx-xxxx-{externalAccountNumber.slice(-4)}</span> </div> <div className="flex items-center justify-between"> <span className="text-primary-600">Date:</span> <span className="text-primary-700">{new Date().toLocaleDateString()}</span> </div> {externalMemo && ( <div className="flex items-center justify-between"> <span className="text-primary-600">Memo:</span> <span className="text-primary-700">{externalMemo}</span> </div> )} </div> <div className="flex space-x-3"> <Button variant="outline" className="flex-1 border-primary-300 text-primary-700 hover:bg-primary-50 transition-all" onClick={handleExternalReset} > New Transfer </Button> <Button className="flex-1 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all" asChild > <Link href="/dashboard">Go to Dashboard</Link> </Button> </div> </div> );
return (

<div className="space-y-6"> <div className="flex items-center space-x-4"> <Button variant="outline" size="icon" asChild className="border-primary-300 text-primary-700 hover:bg-primary-50" > <Link href="/dashboard"> <ArrowLeft className="h-4 w-4" /> </Link> </Button> <h1 className="text-2xl font-bold text-primary-900">Transfer Money</h1> </div> <Tabs value={transferType} onValueChange={(value) => setTransferType(value as "internal" | "external" | "zelle")}> <TabsList className="grid w-full grid-cols-3 bg-primary-100"> <TabsTrigger value="internal" className="text-primary-700">Internal</TabsTrigger> <TabsTrigger value="external" className="text-primary-700">External</TabsTrigger> <TabsTrigger value="zelle" className="text-primary-700">Zelle</TabsTrigger> </TabsList> <TabsContent value="internal" className="mt-4"> <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg"> <CardHeader> <CardTitle className="text-primary-900"> {internalStep === "form" ? "Internal Transfer" : internalStep === "phone" ? "Enter Phone Number" : internalStep === "verify" ? "Verify Transfer" : "Transfer Status"} </CardTitle> <CardDescription className="text-primary-600"> {internalStep === "form" ? "Transfer money between your accounts" : internalStep === "phone" ? "Provide your phone number for SMS verification" : internalStep === "verify" ? "Enter verification code to complete transfer" : "Your transfer has been processed"} </CardDescription> </CardHeader> <CardContent> {error && ( <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200 text-red-800"> <AlertDescription>{error}</AlertDescription> </Alert> )} {internalStep === "form" && renderInternalForm()} {internalStep === "phone" && renderInternalPhoneStep()} {internalStep === "verify" && renderInternalVerify()} {internalStep === "result" && renderInternalResult()} </CardContent> </Card> </TabsContent> <TabsContent value="external" className="mt-4"> <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg"> <CardHeader> <CardTitle className="text-primary-900"> {externalStep === "form" ? "External Transfer" : externalStep === "phone" ? "Enter Phone Number" : externalStep === "verify" ? "Verify Transfer" : "Transfer Status"} </CardTitle> <CardDescription className="text-primary-600"> {externalStep === "form" ? "Transfer money to an external bank account" : externalStep === "phone" ? "Provide your phone number for SMS verification" : externalStep === "verify" ? "Enter verification code to complete transfer" : "Your transfer has been processed"} </CardDescription> </CardHeader> <CardContent> {error && ( <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200 text-red-800"> <AlertDescription>{error}</AlertDescription> </Alert> )} {externalStep === "form" && renderExternalForm()} {externalStep === "phone" && renderExternalPhoneStep()} {externalStep === "verify" && renderExternalVerify()} {externalStep === "result" && renderExternalResult()} </CardContent> </Card> </TabsContent> <TabsContent value="zelle" className="mt-4"> <ZelleTransfer checkingBalance={getBalance("checking")} /> </TabsContent> </Tabs> </div> ); }
export default function TransferPage() {
return (
<Suspense fallback={<div>Loading...</div>}>
<TransferContent />
</Suspense>
);
}