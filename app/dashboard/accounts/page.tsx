"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  History,
  Bitcoin,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Color from "color";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

interface Account {
  name: string;
  number: string;
  fullNumber: string;
  balance: number;
  type: string;
  status: string;
  openedDate: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: string;
  accountType: string;
}

export default function AccountsPage() {
  useAuth(); // Proactively check token validity and handle expiration

  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showWalletNumber, setShowWalletNumber] = useState(false);
  const [activeTab, setActiveTab] = useState("checking");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [btcPrice, setBtcPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<{
    primaryColor: string;
    secondaryColor: string;
  } | null>(null);

  // Fetch colors (public endpoint, no auth required)
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("/api/colors");
        if (!response.ok) {
          throw new Error("Failed to fetch colors");
        }
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
          document.documentElement.style.setProperty(
            `--primary-${shade}`,
            color
          );
        });

        Object.entries(secondaryShades).forEach(([shade, color]) => {
          document.documentElement.style.setProperty(
            `--secondary-${shade}`,
            color
          );
        });
      } catch (error: unknown) {
        console.error(
          "Error fetching colors:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    };
    fetchColors();
  }, []);

  // Fetch accounts and initial BTC price
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await apiFetch("/api/accounts", {
          method: "GET",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        const newAccounts: Account[] = [
          {
            name: "Checking Account",
            number:
              data.checkingNumber?.slice(-4).padStart(12, "x") ||
              "xxxx-xxxx-xxxx",
            fullNumber: data.checkingNumber || "Not Available",
            balance: data.checkingBalance || 0,
            type: "checking",
            status: "active",
            openedDate: data.openedDate || "N/A",
          },
          {
            name: "Savings Account",
            number:
              data.savingsNumber?.slice(-4).padStart(12, "x") ||
              "xxxx-xxxx-xxxx",
            fullNumber: data.savingsNumber || "Not Available",
            balance: data.savingsBalance || 0,
            type: "savings",
            status: "active",
            openedDate: data.openedDate || "N/A",
          },
          {
            name: "Bitcoin Wallet",
            number:
              data.cryptoNumber?.slice(-4).padStart(12, "x") ||
              "xxxx-xxxx-xxxx",
            fullNumber: data.cryptoNumber || "Not Available",
            balance: data.cryptoBalance || 0,
            type: "crypto",
            status: "active",
            openedDate: data.openedDate || "N/A",
          },
        ];
        setAccounts(newAccounts);
        setError(null);
      } catch (error: unknown) {
        if (error instanceof Error && error.message !== "Unauthorized") {
          console.error("Fetch error:", error.message);
          setError(error.message);
          setAccounts([
            {
              name: "Checking Account",
              number: "xxxx-xxxx-xxxx",
              fullNumber: "Not Available",
              balance: 0,
              type: "checking",
              status: "active",
              openedDate: "N/A",
            },
            {
              name: "Savings Account",
              number: "xxxx-xxxx-xxxx",
              fullNumber: "Not Available",
              balance: 0,
              type: "savings",
              status: "active",
              openedDate: "N/A",
            },
            {
              name: "Bitcoin Wallet",
              number: "xxxx-xxxx-xxxx",
              fullNumber: "Not Available",
              balance: 0,
              type: "crypto",
              status: "active",
              openedDate: "N/A",
            },
          ]);
        }
      }
    };

    const fetchBtcPrice = async () => {
      try {
        const response = await fetch("/api/price");
        if (!response.ok) throw new Error("Failed to fetch BTC price");
        const data = await response.json();
        setBtcPrice(data.bitcoin?.usd || 0);
        setPriceChange(data.bitcoin?.usd_24h_change || 0);
      } catch (error: unknown) {
        console.error("BTC price fetch error:", error instanceof Error ? error.message : "Unknown error");
      }
    };

    fetchAccounts();
    fetchBtcPrice();
  }, []);

  // Fetch transactions for the active account type
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await apiFetch(
          `/api/accounts/transactions?accountType=${activeTab}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        setTransactions(data.transactions);
        setError(null);
      } catch (error: unknown) {
        if (error instanceof Error && error.message !== "Unauthorized") {
          console.error("Fetch transactions error:", error.message);
          setError(error.message);
          setTransactions([]);
        }
      }
    };

    fetchTransactions();
  }, [activeTab]);

  // Fetch BTC price every 10 minutes
  useEffect(() => {
    const priceInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/price");
        if (!response.ok) throw new Error("Price update failed");
        const data = await response.json();
        setBtcPrice(data.bitcoin?.usd || 0);
        setPriceChange(data.bitcoin?.usd_24h_change || 0);
      } catch (error: unknown) {
        console.error("Price update error:", error instanceof Error ? error.message : "Unknown error");
      }
    }, 600000); // 10 minutes = 600,000 ms

    return () => clearInterval(priceInterval);
  }, []);

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
            My Accounts
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-1 w-full bg-primary-100/70 p-2 rounded-lg mb-6">
            <TabsTrigger
              value="checking"
              className="text-sm sm:text-base py-2 sm:py-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
            >
              Checking Account
            </TabsTrigger>
            <TabsTrigger
              value="savings"
              className="text-sm sm:text-base py-2 sm:py-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
            >
              Savings Account
            </TabsTrigger>
            <TabsTrigger
              value="crypto"
              className="text-sm sm:text-base py-2 sm:py-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
            >
              Crypto Wallet
            </TabsTrigger>
          </TabsList>

          {accounts.map((account) => {
            const cryptoValue =
              account.type === "crypto" ? account.balance * btcPrice : 0;
            return (
              <TabsContent key={account.type} value={account.type}>
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div
                      className={`absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity ${
                        account.type === "checking"
                          ? "bg-gradient-to-br from-primary-500/10 to-blue-500/10"
                          : account.type === "savings"
                          ? "bg-gradient-to-br from-emerald-500/10 to-green-500/10"
                          : "bg-gradient-to-br from-amber-500/10 to-orange-500/10"
                      }`}
                    ></div>
                    <CardHeader className="relative z-10">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-xl font-bold text-primary-900">
                            {account.name}
                          </CardTitle>
                          <CardDescription className="text-primary-700">
                            Account Details
                          </CardDescription>
                        </div>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none">
                          {account.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-primary-600 font-medium">
                            {account.type === "crypto"
                              ? "Bitcoin Balance"
                              : "Current Balance"}
                          </span>
                          <div className="flex items-center">
                            <span className="font-bold text-lg text-primary-900">
                              {account.type === "crypto"
                                ? `${account.balance.toFixed(6)} BTC`
                                : `$${account.balance.toFixed(2)}`}
                            </span>
                            {account.type === "crypto" && (
                              <Bitcoin className="ml-2 h-5 w-5 text-amber-500" />
                            )}
                          </div>
                        </div>
                        {account.type === "crypto" && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-primary-600 font-medium">
                                USD Value
                              </span>
                              <span className="font-medium text-primary-900">
                                ${cryptoValue.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-primary-600 font-medium">
                                Current BTC Price
                              </span>
                              <div className="flex items-center">
                                <span className="font-medium text-primary-900">
                                  ${btcPrice.toFixed(2)}
                                </span>
                                <div
                                  className={`ml-2 flex items-center ${
                                    priceChange >= 0
                                      ? "text-emerald-500"
                                      : "text-red-500"
                                  }`}
                                >
                                  {priceChange >= 0 ? (
                                    <ArrowUp className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ArrowDown className="h-3 w-3 mr-1" />
                                  )}
                                  <span className="text-xs font-bold">
                                    {Math.abs(priceChange).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="pt-4 border-t border-primary-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-primary-600 font-medium">
                            {account.type === "crypto"
                              ? "Wallet Number"
                              : "Account Number"}
                          </span>
                          <div className="flex items-center">
                            <span className="font-mono mr-2 text-primary-900">
                              {account.type === "crypto" && showWalletNumber
                                ? account.fullNumber
                                : showAccountNumber
                                ? account.fullNumber
                                : account.number}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-primary-600 hover:text-primary-800 hover:bg-primary-100"
                              onClick={() =>
                                account.type === "crypto"
                                  ? setShowWalletNumber(!showWalletNumber)
                                  : setShowAccountNumber(!showAccountNumber)
                              }
                            >
                              {(
                                account.type === "crypto"
                                  ? showWalletNumber
                                  : showAccountNumber
                              ) ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-primary-600 font-medium">
                            Account Type
                          </span>
                          <span className="capitalize text-primary-900">
                            {account.type}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-primary-600 font-medium">
                            Opened On
                          </span>
                          <span className="text-primary-900">
                            {account.openedDate}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end relative z-10">
                      <Button
                        asChild
                        className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
                      >
                        <Link
                          href={
                            account.type === "crypto"
                              ? "/dashboard/crypto"
                              : "/dashboard/transfers"
                          }
                        >
                          {account.type === "crypto" ? (
                            <Bitcoin className="mr-2 h-4 w-4" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          {account.type === "crypto"
                            ? "Manage Crypto"
                            : "New Transaction"}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>

                  <div className="space-y-6">
                    <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-primary-900">
                          Recent {account.name} Transactions
                        </CardTitle>
                        <CardDescription className="text-primary-700">
                          Last 5 transactions on this account
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {transactions
                            .filter((tx) => tx.accountType === account.type)
                            .slice(0, 5)
                            .map((tx) => (
                              <div
                                key={tx.id}
                                className="flex justify-between items-center p-3 rounded-lg hover:bg-primary-50/50 transition-colors"
                              >
                                <div>
                                  <div className="font-medium text-primary-900">
                                    {tx.description}
                                  </div>
                                  <div className="text-sm text-primary-600">
                                    {new Date(tx.date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div
                                  className={`font-bold ${
                                    tx.amount > 0
                                      ? "text-emerald-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {tx.amount > 0 ? "+" : ""}
                                  {account.type === "crypto"
                                    ? `${tx.amount.toFixed(6)} BTC`
                                    : `$${Math.abs(tx.amount).toFixed(2)}`}
                                </div>
                              </div>
                            ))}
                          {transactions.filter(
                            (tx) => tx.accountType === account.type
                          ).length === 0 && (
                            <div className="text-center text-primary-600">
                              No transactions found.
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          className="w-full border-primary-200 text-primary-700 hover:bg-primary-50"
                          asChild
                        >
                          <Link href="/dashboard/transactions">
                            <History className="mr-2 h-4 w-4" />
                            View All Transactions
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}