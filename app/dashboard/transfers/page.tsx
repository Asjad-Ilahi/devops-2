"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote as Bank, Send, Wallet, Search, Check, Loader2 } from "lucide-react";
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

function ZelleTransfer({ checkingBalance, updateAccounts }: { checkingBalance: number; updateAccounts: () => Promise<void> }) {
  const [step, setStep] = useState<"select" | "amount" | "confirmation" | "verify" | "result">("select");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" });
  const [contactType, setContactType] = useState<"email" | "phone">("email");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimit>({ attempts: 0, lastAttempt: 0 });
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchAndVerifyContacts = async () => {
      const storedContacts = localStorage.getItem("recentZelleContacts");
      let contacts: Contact[] = storedContacts ? JSON.parse(storedContacts) : [];
      const verifiedContacts = await Promise.all(
        contacts.map(async (contact: Contact) => {
          try {
            const value = contact.email || contact.phone;
            const type = contact.email ? "email" : "phone";
            const response = await fetch("/api/user/check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contactType: type, value }),
            });
            const data = await response.json();
            if (response.ok && data.exists) {
              return contact;
            }
            return null;
          } catch (error) {
            console.error(`Error verifying contact ${contact.id}:`, error);
            return null;
          }
        })
      );
      const validContacts = verifiedContacts.filter((contact): contact is Contact => contact !== null);
      setRecentContacts(validContacts);
      const contactId = searchParams.get("contactId");
      if (contactId) {
        const contact = validContacts.find((c: Contact) => c.id === contactId);
        if (contact) {
          setSelectedContact(contact);
          setContactType(contact.email ? "email" : "phone");
          setStep("amount");
        }
      }
    };
    fetchAndVerifyContacts();
  }, [searchParams]);

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
    const contact: Contact = {
      id: `new-${Date.now()}`,
      name: newContact.name,
      email: contactType === "email" ? newContact.email : "",
      phone: contactType === "phone" ? newContact.phone : "",
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
    setIsLoading(false);
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

  const handleConfirmation = async () => {
    setIsLoading(true);
    setError(null);
    const transferAmount = Number.parseFloat(amount);
    if (transferAmount > checkingBalance) {
      setError(`Insufficient balance. Current balance: $${checkingBalance.toFixed(2)}`);
      setStep("amount");
      setIsLoading(false);
      return;
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
          verificationMethod: "email",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error(`API error: ${response.status} ${response.statusText}`, data);
        setError(data.error || `Transfer request failed: ${response.statusText}`);
        setIsLoading(false);
        return;
      }
      if (data.requiresVerification) {
        setStep("verify");
      } else {
        await updateAccounts();
        setStep("result");
      }
    } catch (error) {
      console.error("Network or unexpected error:", error);
      setError("An error occurred while requesting the transfer. Please try again.");
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
      const response = await fetch("/api/transfer/zelle/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ verificationCode, verificationMethod: "email" }),
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
      await updateAccounts();
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
        body: JSON.stringify({ recipient: { type: contactType, value: recipientValue }, verificationMethod: "email" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to resend code");
        setIsLoading(false);
        return;
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
    setError(null);
    setRateLimit({ attempts: 0, lastAttempt: 0 });
  };

  const renderSelectContactStep = () => (
    <div className="space-y-6">
      <Tabs defaultValue="recent">
        <TabsList className="grid w-full grid-cols-2 bg-primary-50/50 border-primary-200">
          <TabsTrigger value="recent" className="text-primary-700 data-[state=active]:bg-primary-100 data-[state=active]:text-primary-900">Recent</TabsTrigger>
          <TabsTrigger value="new" className="text-primary-700 data-[state=active]:bg-primary-100 data-[state=active]:text-primary-900">New Recipient</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary-500" />
            <Input
              type="search"
              placeholder="Search recent recipients..."
              className="pl-8 border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
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
                  className="w-full justify-start h-auto py-3 border-primary-200 hover:bg-primary-50 text-primary-900"
                  onClick={() => handleContactSelect(contact)}
                >
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback className="bg-primary-100 text-primary-700">{contact.initials}</AvatarFallback>
                  </Avatar>
                  <div className="text-left overflow-hidden">
                    <div className="font-medium truncate">{contact.name}</div>
                    <div className="text-sm text-primary-600 truncate">{contact.email || contact.phone}</div>
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
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="font-medium text-primary-800">Name</Label>
              <Input
                id="name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="Enter recipient's name"
                className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-primary-800">Contact Method</Label>
                <div className="flex border border-primary-200 rounded-md overflow-hidden">
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm ${contactType === "email" ? "bg-primary-600 text-white" : "bg-white/80 text-primary-700"}`}
                    onClick={() => setContactType("email")}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1 text-sm ${contactType === "phone" ? "bg-primary-600 text-white" : "bg-white/80 text-primary-700"}`}
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
                  className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
                />
              )}
              {contactType === "phone" && (
                <Input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
                />
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-primary-600 text-white hover:bg-primary-700"
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
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="amount" className="font-medium text-primary-800">
            Amount (Balance: ${checkingBalance.toFixed(2)})
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-700">$</div>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              className="pl-7 border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="memo" className="font-medium text-primary-800">Memo (Optional)</Label>
          <Input
            id="memo"
            placeholder="What's this for?"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-200 text-primary-700 hover:bg-primary-50"
            onClick={() => setStep("select")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
          >
            Continue
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
        <div className="border border-primary-200 rounded-lg p-4 space-y-4 bg-white/80">
          <div className="flex items-center justify-between">
            <span className="text-primary-600">To:</span>
            <span className="font-medium text-primary-900 truncate">{selectedContact?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Email/Phone:</span>
            <span className="text-primary-900 truncate">{contactType === "email" ? selectedContact?.email : selectedContact?.phone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Amount:</span>
            <span className="font-bold text-primary-900">${Number.parseFloat(amount).toFixed(2)}</span>
          </div>
          {memo && (
            <div className="flex items-center justify-between">
              <span className="text-primary-600">Memo:</span>
              <span className="text-primary-900 truncate">{memo}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Verification:</span>
            <span className="text-primary-900">Email</span>
          </div>
        </div>
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1 border-primary-200 text-primary-700 hover:bg-primary-50"
            onClick={() => setStep("amount")}
          >
            Back
          </Button>
          <Button
            className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
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
          Enter the 6-digit code sent to your email
        </p>
      </div>
      <form onSubmit={handleVerify} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="verificationCode" className="font-medium text-primary-800">Verification Code</Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <Button
          type="button"
          variant="link"
          className="w-full text-primary-700 hover:text-primary-900"
          onClick={handleResendCode}
          disabled={isLoading || rateLimit.attempts >= 3}
        >
          Resend Code
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-200 text-primary-700 hover:bg-primary-50"
            onClick={() => setStep("confirmation")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
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
      <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-green-700" />
      </div>
      <h3 className="text-xl font-bold text-primary-900">Transfer Successful!</h3>
      <p className="text-primary-600">
        You've sent ${Number.parseFloat(amount).toFixed(2)} to {selectedContact?.name}
      </p>
      <div className="border border-primary-200 rounded-lg p-4 space-y-2 text-left bg-white/80">
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Amount:</span>
          <span className="font-bold text-primary-900">${Number.parseFloat(amount).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">To:</span>
          <span className="text-primary-900">{selectedContact?.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">{contactType === "email" ? "Email:" : "Phone:"}</span>
          <span className="text-primary-900">{contactType === "email" ? selectedContact?.email : selectedContact?.phone}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Date:</span>
          <span className="text-primary-900">{new Date().toLocaleDateString()}</span>
        </div>
        {memo && (
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Memo:</span>
            <span className="text-primary-900">{memo}</span>
          </div>
        )}
      </div>
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 border-primary-200 text-primary-700 hover:bg-primary-50"
          onClick={handleStartOver}
        >
          New Transfer
        </Button>
        <Button
          className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
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
          {step === "select" ? (
            "Select Recipient"
          ) : step === "amount" ? (
            "Enter Amount"
          ) : step === "confirmation" ? (
            "Confirm Transfer"
          ) : step === "verify" ? (
            "Verify Transfer"
          ) : (
            "Transfer Status"
          )}
        </CardTitle>
        <CardDescription className="text-primary-600">
          {step === "select"
            ? "Choose who you want to send money to"
            : step === "amount"
            ? "Enter the amount to send"
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
  const [internalStep, setInternalStep] = useState<"form" | "verify" | "result">("form");
  const [internalVerificationCode, setInternalVerificationCode] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [externalStep, setExternalStep] = useState<"form" | "verify" | "result">("form");
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
  const [internalRateLimit, setInternalRateLimit] = useState<RateLimit>({ attempts: 0, lastAttempt: 0 });
  const [externalRateLimit, setExternalRateLimit] = useState<RateLimit>({ attempts: 0, lastAttempt: 0 });
  const [colors, setColors] = useState<Colors | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

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
        setIs2FAEnabled(data.twoFactorEnabled || false);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load accounts");
      }
    };
    fetchAccounts();
  }, []);

  const updateAccounts = async () => {
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
      setAccounts([
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
      ]);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load accounts");
    }
  };

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
          verificationMethod: "email",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Transfer request failed");
        setIsLoading(false);
        return;
      }
      if (data.requiresVerification) {
        setInternalStep("verify");
      } else {
        await updateAccounts();
        setInternalStep("result");
      }
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
          verificationMethod: "email",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }
      await updateAccounts();
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
        body: JSON.stringify({ verificationMethod: "email" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to resend code");
        setIsLoading(false);
        return;
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
    setError(null);
    setInternalRateLimit({ attempts: 0, lastAttempt: 0 });
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
          verificationMethod: "email",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "External transfer request failed");
        setIsLoading(false);
        return;
      }
      if (data.requiresVerification) {
        setExternalStep("verify");
      } else {
        await updateAccounts();
        setExternalStep("result");
      }
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
          verificationMethod: "email",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Verification failed");
        setIsLoading(false);
        return;
      }
      await updateAccounts();
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
        body: JSON.stringify({ verificationMethod: "email" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to resend code");
        setIsLoading(false);
        return;
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
    setError(null);
    setExternalRateLimit({ attempts: 0, lastAttempt: 0 });
  };

  const renderInternalForm = () => (
    <form onSubmit={handleInternalTransfer} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="internalFrom" className="font-medium text-primary-800">From Account</Label>
            <Select value={internalFrom} onValueChange={setInternalFrom}>
              <SelectTrigger id="internalFrom" className="border-primary-200 bg-white/80 text-primary-900">
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
            <Label htmlFor="internalTo" className="font-medium text-primary-800">To Account</Label>
            <Select value={internalTo} onValueChange={setInternalTo}>
              <SelectTrigger id="internalTo" className="border-primary-200 bg-white/80 text-primary-900">
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
          <Label htmlFor="internalAmount" className="font-medium text-primary-800">Amount</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-700">$</div>
            <Input
              id="internalAmount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="pl-7 border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
              value={internalAmount}
              onChange={(e) => setInternalAmount(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="internalMemo" className="font-medium text-primary-800">Memo</Label>
          <Input
            id="internalMemo"
            placeholder="Add a note for this transfer"
            value={internalMemo}
            onChange={(e) => setInternalMemo(e.target.value)}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-primary-600 text-white hover:bg-primary-700"
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
          Enter the 6-digit code sent to your email
        </p>
      </div>
      <form onSubmit={handleInternalVerify} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="internalVerificationCode" className="font-medium text-primary-800">Verification Code</Label>
          <Input
            id="internalVerificationCode"
            type="text"
            placeholder="Enter 6-digit code"
            value={internalVerificationCode}
            onChange={(e) => setInternalVerificationCode(e.target.value)}
            maxLength={6}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <Button
          type="button"
          variant="link"
          className="w-full text-primary-700 hover:text-primary-900"
          onClick={handleInternalResendCode}
          disabled={isLoading || internalRateLimit.attempts >= 3}
        >
          Resend Code
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-200 text-primary-700 hover:bg-primary-50"
            onClick={() => setInternalStep("form")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
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
      <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-green-700" />
      </div>
      <h3 className="text-xl font-bold text-primary-900">Transfer Successful!</h3>
      <p className="text-primary-600">
        You've transferred ${Number.parseFloat(internalAmount).toFixed(2)} from{" "}
        {internalFrom.charAt(0).toUpperCase() + internalFrom.slice(1)} to{" "}
        {internalTo.charAt(0).toUpperCase() + internalTo.slice(1)}
      </p>
      <div className="border border-primary-200 rounded-lg p-4 space-y-2 text-left bg-white/80">
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Amount:</span>
          <span className="font-bold text-primary-900">${Number.parseFloat(internalAmount).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">From:</span>
          <span className="text-primary-900">{internalFrom.charAt(0).toUpperCase() + internalFrom.slice(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">To:</span>
          <span className="text-primary-900">{internalTo.charAt(0).toUpperCase() + internalTo.slice(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Date:</span>
          <span className="text-primary-900">{new Date().toLocaleDateString()}</span>
        </div>
        {internalMemo && (
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Memo:</span>
            <span className="text-primary-900">{internalMemo}</span>
          </div>
        )}
      </div>
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 border-primary-200 text-primary-700 hover:bg-primary-50"
          onClick={handleInternalReset}
        >
          New Transfer
        </Button>
        <Button
          className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
          asChild
        >
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );

  const renderExternalForm = () => (
    <form onSubmit={handleExternalTransfer} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="externalAccount" className="font-medium text-primary-800">From Account</Label>
          <Select value={externalAccount} onValueChange={setExternalAccount}>
            <SelectTrigger id="externalAccount" className="border-primary-200 bg-white/80 text-primary-900">
              <SelectValue placeholder="Select your account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="checking">Checking Account (xxxx-xxxx-4582)</SelectItem>
              <SelectItem value="savings">Savings Account (xxxx-xxxx-7891)</SelectItem>
            </SelectContent>
          </Select>
          {externalAccount && (
            <p className="text-sm text-primary-600">Available balance: ${getBalance(externalAccount).toFixed(2)}</p>
          )}
        </div>
        <Separator className="bg-primary-200" />
        <div className="space-y-2">
          <Label htmlFor="externalBankName" className="font-medium text-primary-800">External Bank Name</Label>
          <Input
            id="externalBankName"
            placeholder="Enter bank name"
            value={externalBankName}
            onChange={(e) => setExternalBankName(e.target.value)}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalAccountNumber" className="font-medium text-primary-800">Account Number</Label>
          <Input
            id="externalAccountNumber"
            placeholder="Enter account number"
            value={externalAccountNumber}
            onChange={(e) => setExternalAccountNumber(e.target.value)}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalStreet" className="font-medium text-primary-800">Recipient Number & Street</Label>
          <Input
            id="externalStreet"
            placeholder="Enter street address"
            value={externalStreet}
            onChange={(e) => setExternalStreet(e.target.value)}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalCity" className="font-medium text-primary-800">Recipient City</Label>
          <Input
            id="externalCity"
            placeholder="Enter city"
            value={externalCity}
            onChange={(e) => setExternalCity(e.target.value)}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalState" className="font-medium text-primary-800">Recipient State</Label>
          <Input
            id="externalState"
            placeholder="Enter state"
            value={externalState}
            onChange={(e) => setExternalState(e.target.value)}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalZip" className="font-medium text-primary-800">Recipient Zip Code</Label>
          <Input
            id="externalZip"
            placeholder="Enter 5-digit zip code"
            value={externalZip}
            onChange={(e) => setExternalZip(e.target.value)}
            maxLength={5}
            pattern="\d{5}"
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalPhone" className="font-medium text-primary-800">Recipient Phone Number</Label>
          <Input
            id="externalPhone"
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={externalPhone}
            onChange={(e) => setExternalPhone(e.target.value)}
            maxLength={10}
            pattern="\d{10}"
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalAmount" className="font-medium text-primary-800">Amount</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-700">$</div>
            <Input
              id="externalAmount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="pl-7 border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
              value={externalAmount}
              onChange={(e) => setExternalAmount(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="externalMemo" className="font-medium text-primary-800">Memo (Optional)</Label>
          <Input
            id="externalMemo"
            placeholder="Add a note for this transfer"
            value={externalMemo}
            onChange={(e) => setExternalMemo(e.target.value)}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-primary-600 text-white hover:bg-primary-700"
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

  const renderExternalVerify = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-primary-900">Verify Transfer</h3>
        <p className="text-sm text-primary-600">Enter the 6-digit code sent to your email</p>
      </div>
      <form onSubmit={handleExternalVerify} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="externalVerificationCode" className="font-medium text-primary-800">Verification Code</Label>
          <Input
            id="externalVerificationCode"
            type="text"
            placeholder="Enter 6-digit code"
            value={externalVerificationCode}
            onChange={(e) => setExternalVerificationCode(e.target.value)}
            maxLength={6}
            className="border-primary-200 focus:border-primary-400 bg-white/80 text-primary-900"
          />
        </div>
        <Button
          type="button"
          variant="link"
          className="w-full text-primary-700 hover:text-primary-900"
          onClick={handleExternalResendCode}
          disabled={isLoading || externalRateLimit.attempts >= 3}
        >
          Resend Code
        </Button>
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-primary-200 text-primary-700 hover:bg-primary-50"
            onClick={() => setExternalStep("form")}
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
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

  const renderExternalResult = () => (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-green-700" />
      </div>
      <h3 className="text-xl font-bold text-primary-900">Transfer Scheduled!</h3>
      <p className="text-primary-600">
        Your external transfer of ${Number.parseFloat(externalAmount).toFixed(2)} to {externalBankName} has been scheduled.
      </p>
      <div className="border border-primary-200 rounded-lg p-4 space-y-2 text-left bg-white/80">
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Amount:</span>
          <span className="font-bold text-primary-900">${Number.parseFloat(externalAmount).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">From:</span>
          <span className="text-primary-900">{externalAccount.charAt(0).toUpperCase() + externalAccount.slice(1)} Account</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Bank:</span>
          <span className="text-primary-900">{externalBankName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Account Number:</span>
          <span className="text-primary-900">xxxx-xxxx-{externalAccountNumber.slice(-4)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-primary-600">Date:</span>
          <span className="text-primary-900">{new Date().toLocaleDateString()}</span>
        </div>
        {externalMemo && (
          <div className="flex items-center justify-between">
            <span className="text-primary-600">Memo:</span>
            <span className="text-primary-900">{externalMemo}</span>
          </div>
        )}
      </div>
      <div className="flex space-x-3">
        <Button
          variant="outline"
          className="flex-1 border-primary-200 text-primary-700 hover:bg-primary-50"
          onClick={handleExternalReset}
        >
          New Transfer
        </Button>
        <Button
          className="flex-1 bg-primary-600 text-white hover:bg-primary-700"
          asChild
        >
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6 w-full">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 mb-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
            Money Transfers
          </h1>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="hidden md:block w-full col-span-3 md:grid md:grid-cols-3 md:gap-6">
            <Card
              className={`cursor-pointer transition-all backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg ${transferType === "internal" ? "border-primary-400 bg-primary-50/50" : "hover:border-primary-200"}`}
              onClick={() => setTransferType("internal")}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-primary-900">Between Accounts</CardTitle>
                  <Wallet className="h-5 w-5 text-primary-700" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-primary-600">Transfer money between your own accounts</CardDescription>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg ${transferType === "external" ? "border-primary-400 bg-primary-50/50" : "hover:border-primary-200"}`}
              onClick={() => setTransferType("external")}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-primary-900">External Transfer</CardTitle>
                  <Bank className="h-5 w-5 text-primary-700" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-primary-600">Transfer to external bank accounts</CardDescription>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg ${transferType === "zelle" ? "border-primary-400 bg-primary-50/50" : "hover:border-primary-200"}`}
              onClick={() => setTransferType("zelle")}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium text-primary-900">Zelle Transfer</CardTitle>
                  <Send className="h-5 w-5 text-primary-700" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-primary-600">Send money to friends and family with Zelle</CardDescription>
              </CardContent>
            </Card>
          </div>
          <div className="md:hidden w-full col-span-3">
            <Tabs
              value={transferType}
              onValueChange={(value) => setTransferType(value as "internal" | "external" | "zelle")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 bg-primary-50/50 border-primary-200">
                <TabsTrigger value="internal" className="flex items-center gap-2 text-primary-700 data-[state=active]:bg-primary-100 data-[state=active]:text-primary-900">
                  <Wallet className="h-4 w-4" />
                  <span>Between Accounts</span>
                </TabsTrigger>
                <TabsTrigger value="external" className="flex items-center gap-2 text-primary-700 data-[state=active]:bg-primary-100 data-[state=active]:text-primary-900">
                  <Bank className="h-4 w-4" />
                  <span>External</span>
                </TabsTrigger>
                <TabsTrigger value="zelle" className="flex items-center gap-2 text-primary-700 data-[state=active]:bg-primary-100 data-[state=active]:text-primary-900">
                  <Send className="h-4 w-4" />
                  <span>Zelle</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        {transferType === "internal" && (
          <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary-900">Transfer Between Your Accounts</CardTitle>
              <CardDescription className="text-primary-600">
                Move money between your checking and savings accounts
                {accounts.length > 0 && ` (Balance: $${getBalance("checking").toFixed(2)})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {internalStep === "form" && renderInternalForm()}
              {internalStep === "verify" && renderInternalVerify()}
              {internalStep === "result" && renderInternalResult()}
            </CardContent>
          </Card>
        )}
        {transferType === "external" && (
          <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary-900">External Bank Transfer</CardTitle>
              <CardDescription className="text-primary-600">
                Transfer money to external bank accounts
                {accounts.length > 0 && ` (Balance: $${getBalance("checking").toFixed(2)})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {externalStep === "form" && renderExternalForm()}
              {externalStep === "verify" && renderExternalVerify()}
              {externalStep === "result" && renderExternalResult()}
            </CardContent>
          </Card>
        )}
        {transferType === "zelle" && (
          <Suspense fallback={<div className="p-6 text-primary-600">Loading Zelle transfer...</div>}>
            <ZelleTransfer checkingBalance={getBalance("checking")} updateAccounts={updateAccounts} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={<div className="p-6 text-primary-600">Loading transfers...</div>}>
      <TransferContent />
    </Suspense>
  );
}