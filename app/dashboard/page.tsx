"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, CreditCard, DollarSign, Home, LogOut, Menu, Send, User, FileText } from "lucide-react"
import Color from 'color'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth, logout } from '@/lib/auth'
import { apiFetch } from '@/lib/api'

// Transaction interface
interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type:
    | "deposit"
    | "withdrawal"
    | "transfer"
    | "payment"
    | "fee"
    | "interest"
    | "crypto_buy"
    | "crypto_sell"
  status: "completed" | "pending" | "failed"
  accountType?: "checking" | "savings" | "crypto"
  category?: string
  cryptoAmount?: number
  cryptoPrice?: number
}

// UserData interface
interface UserData {
  fullName: string
  checkingBalance: number
  savingsBalance: number
  cryptoBalance: number
  email: string
}

// Contact interface
interface Contact {
  id: string
  name: string
  email: string
  phone: string
  initials: string
}

export default function DashboardPage() {
  useAuth() // Proactively check token expiration

  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userData, setUserData] = useState<UserData | null>(null)
  const [cryptoValue, setCryptoValue] = useState<number>(0)
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [recentContacts, setRecentContacts] = useState<Contact[]>([])
  const [colors, setColors] = useState<{ primaryColor: string; secondaryColor: string } | null>(null)
  const [settings, setSettings] = useState<any>(null)

  // Fetch colors and settings
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

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/admin/settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          setSettings(null)
        }
      } catch (error) {
        setSettings(null)
      }
    }

    fetchColors()
    fetchSettings()
  }, [])

  // Fetch user data, transactions, and initial BTC price
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await apiFetch("/api/user")
        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data")
        }
        const userData = await userResponse.json()
        setUserData({
          fullName: userData.fullName || "",
          checkingBalance: userData.balance || 0,
          savingsBalance: userData.savingsBalance || 0,
          cryptoBalance: userData.cryptoBalance || 0,
          email: userData.email || "",
        })

        // Fetch BTC price (public endpoint, no auth required)
        const priceResponse = await fetch("/api/price")
        if (!priceResponse.ok) throw new Error("Failed to fetch BTC price")
        const priceData = await priceResponse.json()
        const newBtcPrice: number = priceData.bitcoin?.usd || 0
        setBtcPrice(newBtcPrice)

        // Fetch transactions
        const transactionsResponse = await apiFetch("/api/transactions")
        if (!transactionsResponse.ok) {
          const errorData = await transactionsResponse.json()
          setError(errorData.error || "Failed to fetch transactions")
          setTransactions([])
        } else {
          const transactionsData = await transactionsResponse.json()
          const mappedTransactions = (transactionsData.transactions || []).map((tx: any) => ({
            ...tx,
            id: tx._id.toString(),
          }))
          setTransactions(mappedTransactions)
        }

        // Load recent Zelle contacts from localStorage
        const storedContacts = localStorage.getItem("recentZelleContacts")
        const contacts = storedContacts ? JSON.parse(storedContacts) : []
        setRecentContacts(contacts)
      } catch (error: any) {
        if (error.message !== 'Unauthorized') {
          console.error("Error fetching data:", error)
          setError("An error occurred while loading your dashboard")
        }
        // Note: If error is 'Unauthorized', apiFetch handles logout
      }
    }

    fetchData()
  }, [])

  // Update crypto value when userData or btcPrice changes
  useEffect(() => {
    if (userData) {
      setCryptoValue(userData.cryptoBalance * btcPrice)
    }
  }, [userData, btcPrice])

  // Fetch BTC price every 10 minutes
  useEffect(() => {
    const priceInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/price")
        if (!response.ok) throw new Error("Price update failed")
        const data = await response.json()
        const newBtcPrice: number = data.bitcoin?.usd || 0
        setBtcPrice(newBtcPrice)
      } catch (error: unknown) {
        console.error("Price update error:", error instanceof Error ? error.message : 'Unknown error')
      }
    }, 600000) // 10 minutes = 600,000 ms

    return () => clearInterval(priceInterval)
  }, [])

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-40 bg-white shadow-md border-primary-200"
          >
            <Menu className="h-5 w-5 text-primary-600" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <div className="flex h-full flex-col bg-gradient-to-br from-primary-800 to-secondary-900 text-white">
            <div className="p-4 border-b border-primary-700 bg-gradient-to-r from-primary-900 to-secondary-950">
              <div className="flex items-center gap-2">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="Site Logo" className="h-8 w-auto brightness-200" />
                ) : (
                  <img src="/zelle-logo.svg" alt="Zelle" className="h-8 w-auto brightness-200" />
                )}
              </div>
            </div>
            <nav className="flex-1 overflow-auto py-2">
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Main</h2>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                    <Link href="/dashboard">
                      <Home className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                    <Link href="/dashboard/accounts">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Accounts
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                    <Link href="/dashboard/transactions">
                      <FileText className="mr-2 h-4 w-4" />
                      Transactions
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                    <Link href="/dashboard/transfers">
                      <Send className="mr-2 h-4 w-4" />
                      Transfers
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                    <Link href="/dashboard/crypto">
                      <ArrowUpRight className="mr-2 h-4 w-4" />
                      Crypto
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Settings</h2>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                    <Link href="/dashboard/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex border-r bg-gradient-to-br from-primary-800 to-secondary-900 text-white w-64 flex-col fixed inset-y-0">
        <div className="p-4 border-b border-primary-700 bg-gradient-to-r from-primary-900 to-secondary-950">
          <div className="flex items-center gap-2">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Site Logo" className="h-8 w-auto brightness-200" />
            ) : (
              <img src="/zelle-logo.svg" alt="Zelle" className="h-8 w-auto brightness-200" />
            )}
          </div>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Main</h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/dashboard/accounts">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Accounts
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/dashboard/transactions">
                  <FileText className="mr-2 h-4 w-4" />
                  Transactions
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/dashboard/transfers">
                  <Send className="mr-2 h-4 w-4" />
                  Transfers
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/dashboard/crypto">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Crypto
                </Link>
              </Button>
            </div>
          </div>
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Settings</h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="md:pl-64 flex-1 flex flex-col">
        <header className="bg-white border-b border-primary-100 h-16 sticky top-0 z-30 flex items-center shadow-sm">
          <div className="flex-1 px-6 pl-12 md:pl-6">
            <h1 className="text-xl font-bold md:hidden bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-secondary-700">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4 px-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border-2 border-primary-100">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="@user" />
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                      {userData?.fullName?.charAt(0) || "JD"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/accounts">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Accounts</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="p-4 sm:p-6 flex-1">
          <h1 className="text-2xl font-bold mb-6 hidden md:block bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
            Dashboard
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Account Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="relative group h-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <Card className="relative bg-white border-0 shadow-lg h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-600">Checking Account</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-2xl font-bold">${(userData?.checkingBalance || 0).toFixed(2)}</div>
                  <p className="text-xs text-primary-500">Account #: xxxx-xxxx-4582</p>
                </CardContent>
                <div className="p-4 pt-0 mt-auto">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-md hover:shadow-lg transition-all"
                      asChild
                    >
                      <Link href="/dashboard/transfers">Send Money</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary-200 text-primary-600 hover:bg-primary-50"
                      asChild
                    >
                      <Link href="/dashboard/accounts">Details</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="relative group h-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <Card className="relative bg-white border-0 shadow-lg h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-600">Bitcoin Wallet</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-2xl font-bold">{(userData?.cryptoBalance || 0).toFixed(6)} BTC</div>
                  <p className="text-xs text-amber-500">
                    ≈ ${(cryptoValue || 0).toFixed(2)} (${btcPrice.toFixed(2)}/BTC)
                  </p>
                </CardContent>
                <div className="p-4 pt-0 mt-auto">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md hover:shadow-lg transition-all"
                      asChild
                    >
                      <Link href="/dashboard/crypto">Buy/Sell</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-amber-200 text-amber-600 hover:bg-amber-50"
                      asChild
                    >
                      <Link href="/dashboard/crypto">Details</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="relative group h-full">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
              <Card className="relative bg-white border-0 shadow-lg h-full flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-600">Quick Transfer</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  {recentContacts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {recentContacts.slice(0, 3).map((contact) => (
                        <Button
                          key={contact.id}
                          variant="outline"
                          className="flex flex-col items-center p-3 h-auto border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                          asChild
                        >
                          <Link href={`/dashboard/transfers?type=zelle&contactId=${contact.id}`}>
                            <Avatar className="h-8 w-8 mb-1 border-2 border-emerald-100">
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                                {contact.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{contact.name}</span>
                          </Link>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-emerald-500 flex-1 flex items-center justify-center">
                      No recent recipients
                    </div>
                  )}
                </CardContent>
                <div className="p-4 pt-0 mt-auto">
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all"
                    asChild
                  >
                    <Link href="/dashboard/transfers?type=zelle">Zelle Transfer</Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Recent Transactions */}
          <h2 className="text-xl font-bold mb-4 text-primary-800">Recent Transactions</h2>
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl blur opacity-20"></div>
            <Card className="relative border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="divide-y divide-primary-100">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            transaction.type === "deposit" || transaction.type === "interest"
                              ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                              : transaction.type === "withdrawal" ||
                                transaction.type === "payment" ||
                                transaction.type === "fee"
                                ? "bg-gradient-to-br from-red-500 to-pink-500"
                                : transaction.type === "transfer"
                                  ? "bg-gradient-to-br from-blue-500 to-primary-500"
                                  : "bg-gradient-to-br from-amber-500 to-orange-500" // For crypto_buy, crypto_sell
                          }`}
                        >
                          {transaction.type === "deposit" || transaction.type === "interest" ? (
                            <DollarSign className="h-5 w-5 text-white" />
                          ) : transaction.type === "withdrawal" ||
                            transaction.type === "payment" ||
                            transaction.type === "fee" ? (
                            <CreditCard className="h-5 w-5 text-white" />
                          ) : transaction.type === "transfer" ? (
                            <Send className="h-5 w-5 text-white" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-white" /> // For crypto transactions
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm sm:text-base">{transaction.description}</div>
                          <div className="text-xs text-primary-500">
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`font-bold text-sm sm:text-base ${transaction.amount > 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="p-4 text-center text-primary-500">
                      {error ? "Unable to load transactions" : "No recent transactions found."}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              className="border-primary-200 text-primary-600 hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300"
              asChild
            >
              <Link href="/dashboard/transactions">View All Transactions</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}