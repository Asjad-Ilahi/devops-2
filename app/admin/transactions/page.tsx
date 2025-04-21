"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Color from "color"
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

// Interface for Colors
interface Colors {
  primaryColor: string
  secondaryColor: string
}

// Define User interface
interface User {
  id: string
  name: string
  email: string
}

// Define Transaction interface
interface Transaction {
  id: string
  userId: string
  type: "deposit" | "withdrawal" | "transfer" | "payment" | "fee" | "interest" | "adjustment" | "refund" | "crypto_buy" | "crypto_sell"
  amount: number
  description: string
  date: string
  status: "completed" | "pending" | "failed"
  account: string
  relatedTransactionId?: string
}

interface TransactionGroup {
  id: string
  userIds: string[]
  description: string
  date: string
  amount: number
  status: string
  accounts: string[]
  transactionIds: string[]
  type: string
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
  const [groupedTransactions, setGroupedTransactions] = useState<TransactionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [colors, setColors] = useState<Colors | null>(null)

  // Fetch colors and set CSS custom properties
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("/api/colors")
        if (!response.ok) throw new Error("Failed to fetch colors")
        const data: Colors = await response.json()
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
      } catch (error) {
        console.error("Error fetching colors:", error)
      }
    }
    fetchColors()
  }, [])

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Group transactions
  useEffect(() => {
    const userMap = new Map(users.map((user) => [user.id, user]))
    const grouped: TransactionGroup[] = []
    const processedIds = new Set<string>()

    transactions.forEach((tx) => {
      if (processedIds.has(tx.id)) return

      if (tx.type === "transfer" && tx.relatedTransactionId) {
        const relatedTx = transactions.find(
          (t) => t.id === tx.relatedTransactionId && t.type === "transfer"
        )
        if (relatedTx && !processedIds.has(relatedTx.id)) {
          const isInternal = tx.userId === relatedTx.userId
          const senderTx = tx.amount < 0 ? tx : relatedTx
          const receiverTx = tx.amount > 0 ? tx : relatedTx
          const senderUser = userMap.get(senderTx.userId)?.name || "Unknown"
          const receiverUser = userMap.get(receiverTx.userId)?.name || "Unknown"
          const amount = Math.abs(senderTx.amount)

          let description = ""
          if (isInternal) {
            description = `${senderUser} transferred $${amount.toFixed(2)} from ${senderTx.account} to ${receiverTx.account}`
          } else {
            description = `${senderUser} sent $${amount.toFixed(2)} to ${receiverUser}`
          }

          grouped.push({
            id: `${senderTx.id}-${receiverTx.id}`,
            userIds: [senderTx.userId, receiverTx.userId],
            description,
            date: senderTx.date,
            amount,
            status: senderTx.status === "completed" && receiverTx.status === "completed" ? "completed" : "pending",
            accounts: [senderTx.account, receiverTx.account],
            transactionIds: [senderTx.id, receiverTx.id],
            type: "transfer",
          })
          processedIds.add(senderTx.id)
          processedIds.add(relatedTx.id)
        } else {
          // Fallback for unpaired transfer
          grouped.push({
            id: tx.id,
            userIds: [tx.userId],
            description: tx.description,
            date: tx.date,
            amount: Math.abs(tx.amount),
            status: tx.status,
            accounts: [tx.account],
            transactionIds: [tx.id],
            type: tx.type,
          })
          processedIds.add(tx.id)
        }
      } else {
        grouped.push({
          id: tx.id,
          userIds: [tx.userId],
          description: tx.description,
          date: tx.date,
          amount: tx.amount,
          status: tx.status,
          accounts: [tx.account],
          transactionIds: [tx.id],
          type: tx.type,
        })
        processedIds.add(tx.id)
      }
    })

    // Apply filters
    let filtered = [...grouped]

    if (searchTerm) {
      filtered = filtered.filter((group) =>
        group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        group.userIds.some((userId) => {
          const user = userMap.get(userId)
          return (
            user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }) ||
        group.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (dateRange.from) {
      filtered = filtered.filter((group) => new Date(group.date) >= dateRange.from!)
    }

    if (dateRange.to) {
      filtered = filtered.filter((group) => new Date(group.date) <= dateRange.to!)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((group) => group.type === typeFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((group) => group.status === statusFilter)
    }

    if (amountFilter === "positive") {
      filtered = filtered.filter((group) => group.amount > 0)
    } else if (amountFilter === "negative") {
      filtered = filtered.filter((group) => group.amount < 0)
    }

    setGroupedTransactions(filtered)
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
      case "interest":
        return <ArrowDown className="h-5 w-5 text-green-600" />
      case "withdrawal":
        return <ArrowUp className="h-5 w-5 text-red-600" />
      case "transfer":
        return <Send className="h-5 w-5 text-primary-600" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-orange-600" />
      case "fee":
        return <FileText className="h-5 w-5 text-gray-600" />
      case "refund":
        return <RefreshCcw className="h-5 w-5 text-yellow-600" />
      case "crypto_buy":
        return <CreditCard className="h-5 w-5 text-secondary-600" />
      case "crypto_sell":
        return <CreditCard className="h-5 w-5 text-primary-600" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  // Handle transaction status change (client-side placeholder)
  const handleStatusChange = async (transactionIds: string[], newStatus: "completed" | "pending" | "failed") => {
    try {
      // Update status for all transaction IDs in the group
      const promises = transactionIds.map((txId) =>
        fetch(`/api/admin/transactions/${txId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        })
      )
      const responses = await Promise.all(promises)
      for (const response of responses) {
        if (!response.ok) {
          throw new Error("Failed to update transaction status")
        }
      }
      setGroupedTransactions((prev) =>
        prev.map((group) =>
          group.transactionIds.some((id) => transactionIds.includes(id)) ? { ...group, status: newStatus } : group
        )
      )
    } catch (error) {
      console.error("Error updating status:", error)
      setError("Failed to update transaction status")
    }
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
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="p-6 max-w-7xl mx-auto">
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
          Transaction Management
        </h1>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6 backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-primary-900">Filters</CardTitle>
                <CardDescription className="text-primary-600">Filter transaction history</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-primary-600 hover:text-primary-800 hover:bg-primary-50"
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
                    <SelectItem value="crypto_buy">Crypto Buy</SelectItem>
                    <SelectItem value="crypto_sell">Crypto Sell</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
                >
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
            <CardTitle className="text-primary-900">Transaction History</CardTitle>
            <CardDescription className="text-primary-600">
              {groupedTransactions.length} transactions found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-primary-50/50">
                    <th className="text-left p-4 text-primary-800">ID</th>
                    <th className="text-left p-4 text-primary-800">Users</th>
                    <th className="text-left p-4 text-primary-800">Description</th>
                    <th className="text-left p-4 text-primary-800">Date</th>
                    <th className="text-left p-4 text-primary-800">Accounts</th>
                    <th className="text-right p-4 text-primary-800">Amount</th>
                    <th className="text-center p-4 text-primary-800">Status</th>
                    <th className="text-center p-4 text-primary-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {groupedTransactions.map((group) => {
                    const userNames = group.userIds.map((id) => users.find((u) => u.id === id)?.name || "Unknown User")
                    return (
                      <tr key={group.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs">{group.id}</td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-primary-900">{userNames.join(" to ")}</div>
                            <div className="text-sm text-primary-600">
                              {userNames.map((name, index) => (
                                <span key={group.userIds[index]}>
                                  {users.find((u) => u.id === group.userIds[index])?.email || ""}
                                  {index < userNames.length - 1 ? " to " : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted">
                              {getTransactionIcon(group.type)}
                            </div>
                            <div>
                              <div className="font-medium">{group.description}</div>
                              <div className="text-sm text-muted-foreground capitalize">{group.type.replace("_", " ")}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{new Date(group.date).toLocaleString()}</td>
                        <td className="p-4">{group.accounts.join(" to ")}</td>
                        <td className="p-4 text-right font-medium text-green-600">
                          ${group.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            variant={
                              group.status === "completed"
                                ? "default"
                                : group.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              group.status === "completed"
                                ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                : group.status === "pending"
                                ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                                : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                            }
                          >
                            {group.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary-600 hover:text-primary-800 hover:bg-primary-50"
                              >
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Transaction Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {group.transactionIds.map((txId) => (
                                <DropdownMenuItem key={txId} asChild>
                                  <Link href={`/admin/transactions/${txId}`}>View Details (ID: {txId})</Link>
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${group.userIds[0]}`}>View User</Link>
                              </DropdownMenuItem>
                              {group.userIds.length > 1 && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/users/${group.userIds[1]}`}>View Recipient</Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {group.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusChange(group.transactionIds, "completed")}>
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusChange(group.transactionIds, "failed")}>
                                    Mark as Failed
                                  </DropdownMenuItem>
                                </>
                              )}
                              {group.status === "failed" && (
                                <DropdownMenuItem onClick={() => handleStatusChange(group.transactionIds, "completed")}>
                                  Mark as Completed
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                  {groupedTransactions.length === 0 && (
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