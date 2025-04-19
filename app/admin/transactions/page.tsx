"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Calendar,
  CreditCard,
  Download,
  FileText,
  Search,
  Send,
  RefreshCcw,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DateRange } from "react-day-picker"

// Define User interface (consistent with dashboard)
interface User {
  id: string
  name: string
  email: string
  // Add other fields as needed from the User interface in dashboard
}

// Define Transaction interface (remove userName and userEmail if not provided by API)
interface Transaction {
  id: string
  userId: string
  type: "deposit" | "withdrawal" | "transfer" | "payment" | "fee" | "interest" | "adjustment"
  amount: number
  description: string
  date: string
  status: "completed" | "pending" | "failed"
  account: string
}

export default function AdminTransactionsPage() {
  const router = useRouter()

  // Filters state
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [amountFilter, setAmountFilter] = useState<string>("all")

  // Transactions and Users state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch transactions and users from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [transactionsRes, usersRes] = await Promise.all([
          fetch("/api/admin/transactions", { method: "GET", credentials: "include" }),
          fetch("/api/admin/users", { method: "GET", credentials: "include" }),
        ])

        if (!transactionsRes.ok) {
          const errorText = await transactionsRes.text()
          if (transactionsRes.status === 401) {
            setError("Unauthorized: Please log in again")
            router.push("/admin/login")
            return
          } else if (transactionsRes.status === 403) {
            setError("Forbidden: Admin access required")
            return
          }
          throw new Error(`Failed to fetch transactions: ${errorText}`)
        }

        if (!usersRes.ok) {
          const errorText = await usersRes.text()
          throw new Error(`Failed to fetch users: ${errorText}`)
        }

        const transactionsData = await transactionsRes.json()
        const usersData = await usersRes.json()

        setTransactions(transactionsData.transactions)
        setUsers(usersData.users)
        setFilteredTransactions(transactionsData.transactions)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Apply filters
  useEffect(() => {
    const userMap = new Map(users.map((user) => [user.id, user]))
    let filtered = [...transactions]

    if (searchTerm) {
      filtered = filtered.filter((transaction) => {
        const user = userMap.get(transaction.userId)
        const userName = user?.name || ""
        const userEmail = user?.email || ""
        return (
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
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

    if (typeFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.type === typeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter)
    }

    if (amountFilter === "positive") {
      filtered = filtered.filter((transaction) => transaction.amount > 0)
    } else if (amountFilter === "negative") {
      filtered = filtered.filter((transaction) => transaction.amount < 0)
    }

    setFilteredTransactions(filtered)
  }, [searchTerm, dateRange, typeFilter, statusFilter, amountFilter, transactions, users])

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setDateRange({ from: undefined, to: undefined })
    setTypeFilter("all")
    setStatusFilter("all")
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
      case "adjustment":
        return <FileText className="h-5 w-5 text-purple-600" />
      case "zelle":
        return <Send className="h-5 w-5 text-purple-600" />
      case "refund":
        return <RefreshCcw className="h-5 w-5 text-yellow-600" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  // Handle transaction status change (client-side)
  const handleStatusChange = (transactionId: string, newStatus: "completed" | "pending" | "failed") => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, status: newStatus } : transaction
      )
    )
  }

  // Handle date range selection
  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange({
      from: range?.from,
      to: range?.to,
    })
  }

  // Display loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto">
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
          Transaction Management
        </h1>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6 backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-indigo-900">Filters</CardTitle>
                <CardDescription className="text-indigo-600">Filter transaction history</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                Reset Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search transactions..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange.from}
                      selected={dateRange}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Transaction Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposits</SelectItem>
                    <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    <SelectItem value="transfer">Transfers</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="fee">Fees</SelectItem>
                    <SelectItem value="interest">Interest</SelectItem>
                    <SelectItem value="adjustment">Adjustments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex items-center">
              <span className="text-sm font-medium mr-2">Amount:</span>
              <Tabs value={amountFilter} onValueChange={setAmountFilter} className="w-auto">
                <TabsList className="bg-indigo-100/70 p-1 rounded-lg">
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="positive"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
                  >
                    Income
                  </TabsTrigger>
                  <TabsTrigger
                    value="negative"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
                  >
                    Expenses
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-indigo-900">Transaction History</CardTitle>
            <CardDescription className="text-indigo-600">
              {filteredTransactions.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-indigo-50/50">
                    <th className="text-left p-4 text-indigo-800">ID</th>
                    <th className="text-left p-4 text-indigo-800">User</th>
                    <th className="text-left p-4 text-indigo-800">Description</th>
                    <th className="text-left p-4 text-indigo-800">Date</th>
                    <th className="text-left p-4 text-indigo-800">Account</th>
                    <th className="text-right p-4 text-indigo-800">Amount</th>
                    <th className="text-center p-4 text-indigo-800">Status</th>
                    <th className="text-center p-4 text-indigo-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100">
                  {filteredTransactions.map((transaction) => {
                    const user = users.find((u) => u.id === transaction.userId)
                    return (
                      <tr key={transaction.id} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs">{transaction.id}</td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-indigo-900">{user?.name || "Unknown User"}</div>
                            <div className="text-sm text-indigo-600">{user?.email || ""}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-muted-foreground capitalize">{transaction.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{transaction.date}</td>
                        <td className="p-4">{transaction.account}</td>
                        <td
                          className={`p-4 text-right font-medium ${
                            transaction.amount > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount.toFixed(2)}
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
                        <td className="p-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                              >
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Transaction Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/transactions/${transaction.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${transaction.userId}`}>View User</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {transaction.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(transaction.id, "completed")}>
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(transaction.id, "failed")}>
                                    Mark as Failed
                                  </DropdownMenuItem>
                                </>
                              )}
                              {transaction.status === "failed" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(transaction.id, "completed")}>
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-muted-foreground">
                        No transactions found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}