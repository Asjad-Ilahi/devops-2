"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Color from "color"
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CreditCard,
  Download,
  FileText,
  Search,
  Send,
  RefreshCcw,
  Loader2,
  ArrowLeft,
  MoreHorizontal,
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

interface Colors {
  primaryColor: string
  secondaryColor: string
}

interface User {
  id: string
  name: string
  email: string
}

interface Transaction {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: string
  amount: number
  description: string
  date: string
  status: string
  account: string
  memo?: string
  transferId?: string
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
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [amountFilter, setAmountFilter] = useState<string>("all")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [groupedTransactions, setGroupedTransactions] = useState<TransactionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [colors, setColors] = useState<Colors | null>(null)

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

        // Log raw transactions for debugging
        console.log("Raw transactions:", transactionsData.transactions)
        console.log("Raw users:", usersData.users)

        // Filter out transactions with invalid amounts
        const validTransactions = transactionsData.transactions.filter(
          (tx: Transaction) => typeof tx.amount === "number" && !isNaN(tx.amount) && tx.userId
        )
        setTransactions(validTransactions)
        setUsers(usersData.users)

        if (validTransactions.length === 0) {
          setError("No valid transactions found")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
        console.error("Error fetching data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  useEffect(() => {
    const userMap = new Map(users.map((user) => [user.id, user]))
    const transferGroups = new Map<string, Transaction[]>()
    const remainingTransactions: Transaction[] = []

    transactions.forEach((tx) => {
      if (tx.transferId) {
        const key = tx.transferId
        if (!transferGroups.has(key)) transferGroups.set(key, [])
        transferGroups.get(key)!.push(tx)
      } else {
        remainingTransactions.push(tx)
      }
    })

    const grouped: TransactionGroup[] = []
    transferGroups.forEach((txs, transferId) => {
      const userIds = [...new Set(txs.map((tx) => tx.userId))]
      const date = txs[0].date
      const status = txs.every((tx) => tx.status === "completed") ? "completed" : "pending"
      const accounts = [...new Set(txs.map((tx) => tx.account))]
      const transactionIds = txs.map((tx) => tx.id)

      if (txs.length === 2) {
        const senderTx = txs.find((tx) => tx.amount < 0)
        const receiverTx = txs.find((tx) => tx.amount > 0)
        if (senderTx && receiverTx) {
          const sender = userMap.get(senderTx.userId)
          const receiver = userMap.get(receiverTx.userId)
          grouped.push({
            id: transferId,
            userIds,
            description: `Zelle transfer from ${sender?.name || "Unknown"} to ${receiver?.name || "Unknown"}`,
            date,
            amount: Math.abs(senderTx.amount),
            status,
            accounts,
            transactionIds,
            type: "transfer",
          })
        }
      } else {
        txs.forEach((tx) => {
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
        })
      }
    })

    const txByDate = new Map<string, Transaction[]>()
    remainingTransactions.forEach((tx) => {
      const key = tx.date
      if (!txByDate.has(key)) txByDate.set(key, [])
      txByDate.get(key)!.push(tx)
    })

    txByDate.forEach((txs, date) => {
      const unpaired: Transaction[] = [...txs]
      while (unpaired.length >= 2) {
        let paired = false
        for (let i = 0; i < unpaired.length - 1; i++) {
          for (let j = i + 1; j < unpaired.length; j++) {
            const tx1 = unpaired[i]
            const tx2 = unpaired[j]
            if (
              tx1.amount === -tx2.amount &&
              (tx1.type === "deposit" || tx1.type === "transfer") &&
              (tx2.type === "deposit" || tx2.type === "transfer")
            ) {
              const senderTx = tx1.amount < 0 ? tx1 : tx2
              const receiverTx = tx1.amount < 0 ? tx2 : tx1
              const sender = userMap.get(senderTx.userId)
              const receiver = userMap.get(receiverTx.userId)
              grouped.push({
                id: `${senderTx.id}-${receiverTx.id}`,
                userIds: [senderTx.userId, receiverTx.userId],
                description: `Zelle transfer from ${sender?.name || "Unknown"} to ${receiver?.name || "Unknown"}`,
                date,
                amount: Math.abs(senderTx.amount),
                status: senderTx.status === "completed" && receiverTx.status === "completed" ? "completed" : "pending",
                accounts: [senderTx.account, receiverTx.account],
                transactionIds: [senderTx.id, receiverTx.id],
                type: "transfer",
              })
              unpaired.splice(j, 1)
              unpaired.splice(i, 1)
              paired = true
              break
            }
          }
          if (paired) break
        }
        if (!paired) break
      }
      unpaired.forEach((tx) => {
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
      })
    })

    let filtered = [...grouped]
    if (searchTerm) {
      filtered = filtered.filter(
        (group) =>
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

    // Sort filtered transactions by date in descending order (most recent first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setGroupedTransactions(filtered)
  }, [searchTerm, dateRange, typeFilter, statusFilter, amountFilter, transactions, users])

  const resetFilters = () => {
    setSearchTerm("")
    setDateRange({ from: undefined, to: undefined })
    setTypeFilter("all")
    setStatusFilter("all")
    setAmountFilter("all")
  }

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
      case "crypto_sell":
        return <CreditCard className="h-5 w-5 text-purple-600" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  const handleStatusChange = (transactionId: string, newStatus: "completed" | "pending" | "failed") => {
    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === transactionId ? { ...transaction, status: newStatus } : transaction
      )
    )
    setGroupedTransactions((prev) =>
      prev.map((group) =>
        group.transactionIds.includes(transactionId) ? { ...group, status: newStatus } : group
      )
    )
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange({
      from: range?.from,
      to: range?.to,
    })
  }

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
        <Button variant="ghost" asChild className="p-0 mb-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
          Transaction Management
        </h1>
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}
        <Card className="mb-6 backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
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
                className="text-primary-700 hover:text-primary-900 hover:bg-primary-100"
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
                    <SelectItem value="crypto_buy">Crypto Buy</SelectItem>
                    <SelectItem value="crypto_sell">Crypto Sell</SelectItem>
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
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="positive"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md"
                  >
                    Income
                  </TabsTrigger>
                  <TabsTrigger
                    value="negative"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md"
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
        <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
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
                    const userNames = group.userIds.map(
                      (id) => users.find((u) => u.id === id)?.name || "Unknown User"
                    )
                    const isGroup = group.transactionIds.length > 1
                    const senderTxId = group.transactionIds.find((txId) => {
                      const tx = transactions.find((t) => t.id === txId)
                      return tx?.amount !== undefined && tx.amount < 0
                    })
                    const receiverTxId = group.transactionIds.find((txId) => {
                      const tx = transactions.find((t) => t.id === txId)
                      return tx?.amount !== undefined && tx.amount > 0
                    })
                    const detailLink = isGroup
                      ? `/admin/transactions/${senderTxId}?receiverId=${receiverTxId}`
                      : `/admin/transactions/${group.transactionIds[0]}`

                    return (
                      <tr key={group.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs">
                          {isGroup ? `Group: ${group.id}` : group.id}
                        </td>
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
                              <div className="text-sm text-muted-foreground capitalize">
                                {group.type.replace("_", " ")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{new Date(group.date).toLocaleString()}</td>
                        <td className="p-4">{group.accounts.join(", ")}</td>
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
                            {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Transaction Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {isGroup ? (
                                <DropdownMenuItem asChild>
                                  <Link href={detailLink}>View Transactions</Link>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem asChild>
                                  <Link href={detailLink}>View Details (ID: {group.transactionIds[0]})</Link>
                                </DropdownMenuItem>
                              )}
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
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(group.transactionIds[0], "completed")}
                                  >
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(group.transactionIds[0], "failed")}
                                  >
                                    Mark as Failed
                                  </DropdownMenuItem>
                                </>
                              )}
                              {group.status === "failed" && (
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(group.transactionIds[0], "completed")}
                                >
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