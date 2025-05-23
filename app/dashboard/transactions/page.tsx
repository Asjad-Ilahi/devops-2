"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bitcoin,
  Calendar,
  CreditCard,
  Download,
  FileText,
  Search,
  Send,
  Loader2,
} from "lucide-react"
import Color from 'color'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from '@/lib/auth'
import { apiFetch } from '@/lib/api'

// Transaction interface updated to match Code-02's backend model
interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  type: "deposit" | "withdrawal" | "transfer" | "payment" | "fee" | "interest" | "crypto_buy" | "crypto_sell"
  category: string
  accountType: "checking" | "savings" | "crypto"
  status: "completed" | "pending" | "failed"
  cryptoAmount?: number
  cryptoPrice?: number
}

export default function TransactionsPage() {
  useAuth() // Proactively check token validity and handle expiration

  const searchParams = useSearchParams()
  const router = useRouter()

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [amountFilter, setAmountFilter] = useState<string>("all")

  // Transaction states
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Color states
  const [colors, setColors] = useState<{ primaryColor: string; secondaryColor: string } | null>(null)

  // Fetch colors (public endpoint, no auth required)
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
    fetchColors()
  }, [])

  // Fetch transactions from the server
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await apiFetch("/api/transactions")
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to fetch transactions")
        }
        const data = await response.json()
        const transactionsWithId = data.transactions.map((tx: any) => ({
          ...tx,
          id: tx._id.toString(),
        }))
        setTransactions(transactionsWithId)
        setFilteredTransactions(transactionsWithId)

        const initialAccountFilter = searchParams.get("accountFilter")
        if (initialAccountFilter && isInitialLoad) {
          const mappedFilter = {
            "Checking": "checking",
            "Savings": "savings",
            "Crypto Wallet": "crypto",
          }[initialAccountFilter]
          if (mappedFilter) {
            setAccountFilter(mappedFilter)
          }
          setIsInitialLoad(false)
        }
      } catch (error) {
        if (error instanceof Error && error.message !== 'Unauthorized') {
          console.error("Error fetching transactions:", error)
          setError(error.message)
        } else if (!(error instanceof Error)) {
          setError("An unknown error occurred while fetching transactions")
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadTransactions()
  }, [searchParams, isInitialLoad])

  // Apply filters to transactions
  useEffect(() => {
    let filtered = [...transactions]

    if (searchTerm) {
      filtered = filtered.filter((transaction) =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (dateRange.from) {
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return transactionDate >= dateRange.from!
      })
    }

    if (dateRange.to) {
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return transactionDate <= dateRange.to!
      })
    }

    if (accountFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.accountType === accountFilter)
    }

    if (amountFilter === "positive") {
      filtered = filtered.filter((transaction) => transaction.amount > 0)
    } else if (amountFilter === "negative") {
      filtered = filtered.filter((transaction) => transaction.amount < 0)
    }

    setFilteredTransactions(filtered)
  }, [searchTerm, dateRange, accountFilter, amountFilter, transactions])

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = filteredTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setDateRange({ from: undefined, to: undefined })
    setAccountFilter("all")
    setAmountFilter("all")
  }

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDown className="h-5 w-5 text-green-600" />
      case "withdrawal":
        return <ArrowUp className="h-5 w-5 text-red-600" />
      case "transfer":
        return <Send className="h-5 w-5 text-blue-600" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-orange-600" />
      case "fee":
        return <FileText className="h-5 w-5 text-gray-600" />
      case "interest":
        return <ArrowDown className="h-5 w-5 text-green-600" />
      case "crypto_buy":
        return <Bitcoin className="h-5 w-5 text-amber-500" />
      case "crypto_sell":
        return <Bitcoin className="h-5 w-5 text-amber-500" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  // Map accountType to display name
  const getAccountDisplayName = (accountType: string) => {
    switch (accountType) {
      case "checking":
        return "Checking"
      case "savings":
        return "Savings"
      case "crypto":
        return "Crypto Wallet"
      default:
        return accountType
    }
  }

  // Handler for date range selection
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range ? { from: range.from, to: range.to } : { from: undefined, to: undefined })
  }

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
            Transaction History
          </h1>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-blue-500/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-primary-800">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-primary-900">{filteredTransactions.length}</div>
              <p className="text-xs text-primary-600">
                {transactions.length !== filteredTransactions.length && `Filtered from ${transactions.length} total`}
              </p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-primary-800">Total Income</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-emerald-600">+${totalIncome.toFixed(2)}</div>
              <p className="text-xs text-primary-600">From deposits, transfers, and interest</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-pink-500/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-primary-800">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-red-600">-${totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-primary-600">From withdrawals, payments, and fees</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl font-bold text-primary-900">Filters</CardTitle>
                <CardDescription className="text-primary-700">Filter your transaction history</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                Reset Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary-400" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-8 border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-primary-200 text-primary-700 hover:bg-primary-50"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Date Range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-primary-100 bg-white/90 backdrop-blur-sm" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={2}
                      className="rounded-md border-primary-100"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
                    <SelectValue placeholder="Account" />
                  </SelectTrigger>
                  <SelectContent className="border-primary-100 bg-white/90 backdrop-blur-sm">
                    <SelectItem value="all">All Accounts</SelectItem>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="crypto">Crypto Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center">
              <span className="text-sm font-medium mr-2 text-primary-800">Amount:</span>
              <Tabs value={amountFilter} onValueChange={setAmountFilter} className="w-auto">
                <TabsList className="bg-primary-100/70 p-1 rounded-lg">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="positive"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
                  >
                    Income
                  </TabsTrigger>
                  <TabsTrigger
                    value="negative"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
                  >
                    Expenses
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="ml-auto">
                <Button variant="outline" size="sm" className="border-primary-200 text-primary-700 hover:bg-primary-50">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary-900">Transaction History</CardTitle>
            <CardDescription className="text-primary-700">
              {filteredTransactions.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600" />
                <p className="mt-2 text-primary-700">Loading transactions...</p>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary-100 bg-primary-50/50">
                      <th className="text-left p-4 text-primary-800 font-medium">Description</th>
                      <th className="text-left p-4 text-primary-800 font-medium">Date</th>
                      <th className="text-left p-4 text-primary-800 font-medium">Account</th>
                      <th className="text-right p-4 text-primary-800 font-medium">Amount</th>
                      <th className="text-center p-4 text-primary-800 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary-100">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <div className="font-medium text-primary-900">{transaction.description}</div>
                              <div className="text-sm text-primary-600 capitalize">
                                {transaction.type.replace("_", " ")}
                                {transaction.cryptoAmount && (
                                  <span className="ml-1">
                                    ({transaction.cryptoAmount > 0 ? "+" : ""}
                                    {transaction.cryptoAmount.toFixed(6)} BTC)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-primary-700">{new Date(transaction.date).toLocaleDateString()}</td>
                        <td className="p-4 text-primary-700">{getAccountDisplayName(transaction.accountType)}</td>
                        <td
                          className={`p-4 text-right font-medium ${
                            transaction.amount > 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                          {transaction.cryptoPrice && (
                            <div className="text-xs text-primary-600">@ ${transaction.cryptoPrice.toFixed(2)}/BTC</div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : transaction.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className={
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                : transaction.status === "pending"
                                  ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                                  : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-primary-500">
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-8 w-8 mb-2 text-primary-300" />
                            <p className="text-lg font-medium text-primary-700">
                              No transactions found matching your filters
                            </p>
                            <p className="text-primary-500 mt-1">Try adjusting your search criteria</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}