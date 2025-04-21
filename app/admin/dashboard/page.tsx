"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CreditCard, Home, LogOut, Menu, Plus, Settings, Users, Loader, User } from "lucide-react"
import Color from "color"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Interface for User
interface User {
  id: string
  name: string
  username: string
  email: string
  accountNumber: string
  balance: number
  status: "pending" | "active" | "suspended"
  twoFactorEnabled: boolean
  lastLogin: string
}

// Interface for Transaction
interface Transaction {
  id: string
  userId: string
  type: "deposit" | "withdrawal" | "transfer" | "adjustment"
  amount: number
  description: string
  date: string
  status: "completed" | "pending" | "failed"
}

// Interface for PendingUser
interface PendingUser {
  _id: string
  fullName: string
  username: string
  email: string
  phone: string
  ssn: string
  streetAddress: string
  city: string
  state: string
  zipCode: string
}

// Interface for Colors
interface Colors {
  primaryColor: string
  secondaryColor: string
}

// Helper function to format date to DD-MM-YYYY
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Invalid Date"
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export default function AdminDashboardPage() {
  const router = useRouter()

  // State management
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true)
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalBalance: 0,
    transactionsToday: 0,
  })
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState<boolean>(false)
  const [newTransaction, setNewTransaction] = useState<{
    userId: string
    type: string
    amount: string
    description: string
  }>({
    userId: "",
    type: "deposit",
    amount: "",
    description: "",
  })
  const [isPendingApprovalsOpen, setIsPendingApprovalsOpen] = useState<boolean>(false)
  const [transactionError, setTransactionError] = useState<string | null>(null)
  const [colors, setColors] = useState<Colors | null>(null)

  // Fetch colors
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

  // Authentication check and data fetching
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check-auth", {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          router.push("/admin/login")
          return
        }

        setIsAuthenticated(true)

        const fetchData = async () => {
          try {
            // Fetch users
            const usersRes = await fetch("/api/admin/users", { credentials: "include" })
            if (!usersRes.ok) throw new Error("Failed to fetch users")
            const usersData = await usersRes.json()
            const usersArray: User[] = usersData.users || []

            // Fetch transactions
            const transactionsRes = await fetch("/api/admin/transactions", { credentials: "include" })
            if (!transactionsRes.ok) throw new Error("Failed to fetch transactions")
            const transactionsData = await transactionsRes.json()
            const transactionsArray: Transaction[] = transactionsData.transactions || []

            // Fetch pending users
            const pendingRes = await fetch("/api/admin/pending-users", { credentials: "include" })
            if (!pendingRes.ok) {
              const errorData = await pendingRes.json()
              throw new Error(errorData.error || "Failed to fetch pending users")
            }
            const pendingData = await pendingRes.json()
            const pendingUsersArray: PendingUser[] = pendingData.pendingUsers || []

            // Update state
            setUsers(usersArray)
            setTransactions(transactionsArray)
            setPendingUsers(pendingUsersArray)
            setStats({
              totalUsers: usersArray.length,
              pendingApprovals: pendingUsersArray.length,
              totalBalance: usersArray.reduce((sum, user) => sum + user.balance, 0),
              transactionsToday: transactionsArray.filter(
                (txn) => new Date(txn.date).toDateString() === new Date().toDateString()
              ).length,
            })
          } catch (error) {
            console.error("Error fetching dashboard data:", error)
          }
        }

        await fetchData()
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/admin/login")
      } finally {
        setIsLoadingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  // Handle adding a new transaction
  const handleAddTransaction = async () => {
    if (!newTransaction.userId || !newTransaction.amount || !newTransaction.description) {
      setTransactionError("Please fill in all required fields")
      return
    }

    const amount = parseFloat(newTransaction.amount)
    if (isNaN(amount) || amount === 0) {
      setTransactionError("Please enter a valid non-zero amount")
      return
    }

    try {
      const response = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: newTransaction.userId,
          type: newTransaction.type,
          amount,
          description: newTransaction.description,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to process transaction")
      }

      const { transaction, newBalance } = await response.json()

      const updatedUsers = users.map((user) =>
        user.id === newTransaction.userId ? { ...user, balance: newBalance } : user
      )
      setUsers(updatedUsers)
      setTransactions((prev) => [{ ...transaction, id: transaction._id }, ...prev])
      setStats((prev) => ({
        ...prev,
        totalBalance: updatedUsers.reduce((sum, user) => sum + user.balance, 0),
        transactionsToday:
          new Date(transaction.date).toDateString() === new Date().toDateString()
            ? prev.transactionsToday + 1
            : prev.transactionsToday,
      }))

      setNewTransaction({ userId: "", type: "deposit", amount: "", description: "" })
      setTransactionError(null)
      setIsAddTransactionOpen(false)
    } catch (error) {
      console.error("Error adding transaction:", error)
      setTransactionError(error instanceof Error ? error.message : "Failed to process transaction")
    }
  }

  // Handle approving a pending user
  const handleApproveUser = async (pendingUserId: string) => {
    try {
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pendingUserId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to approve user")
      }

      const approvedUserData = await response.json()
      const approvedUser = pendingUsers.find((u) => u._id === pendingUserId)
      if (approvedUser) {
        const newUser: User = {
          id: pendingUserId,
          name: approvedUser.fullName,
          username: approvedUser.username || "N/A",
          email: approvedUser.email,
          accountNumber: approvedUserData.accountNumber || "N/A",
          balance: 0,
          status: "active",
          twoFactorEnabled: false,
          lastLogin: "N/A",
        }
        setUsers((prev) => [...prev, newUser])
        setPendingUsers((prev) => prev.filter((user) => user._id !== pendingUserId))
        setStats((prev) => ({
          ...prev,
          pendingApprovals: prev.pendingApprovals - 1,
          totalUsers: prev.totalUsers + 1,
          totalBalance: prev.totalBalance + newUser.balance,
        }))
      }
    } catch (error) {
      console.error("Error approving user:", error)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      })
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/admin/login")
    }
  }

  // Render loading state or redirect if not authenticated
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <Loader className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // The router will redirect to login
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Main Sidebar (Desktop) */}
      <div className="hidden md:flex border-r bg-gradient-to-br from-primary-800 to-secondary-900 text-white w-64 flex-col fixed inset-y-0">
        <div className="p-4 border-b border-primary-700 bg-gradient-to-r from-primary-900 to-secondary-950">
          <div className="flex items-center gap-2">
            <img src="/zelle-logo.svg" alt="Zelle" className="h-8 w-auto brightness-200" />
            <Badge variant="secondary">Admin</Badge>
          </div>
        </div>
        <nav className="flex-1 overflow-auto py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Dashboard</h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/admin/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Overview
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  Users
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/admin/transactions">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Transactions
                </Link>
              </Button>
            </div>
          </div>
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Settings</h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/admin/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Site Settings
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </nav>
      </div>

      <div className="flex-1 md:pl-64">
        {/* Header */}
        <header className="bg-white border-b border-primary-100 h-16 sticky top-0 z-30 flex items-center px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5 text-primary-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="flex h-full flex-col bg-gradient-to-br from-primary-800 to-secondary-900 text-white">
                <div className="p-4 border-b border-primary-700 bg-gradient-to-r from-primary-900 to-secondary-950">
                  <div className="flex items-center gap-2">
                    <img src="/zelle-logo.svg" alt="Zelle" className="h-8 w-auto brightness-200" />
                    <Badge variant="secondary">Admin</Badge>
                  </div>
                </div>
                <nav className="flex-1 overflow-auto py-2">
                  <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Dashboard</h2>
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                        <Link href="/admin/dashboard">
                          <Home className="mr-2 h-4 w-4" />
                          Overview
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                        <Link href="/admin/users">
                          <Users className="mr-2 h-4 w-4" />
                          Users
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                        <Link href="/admin/transactions">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Transactions
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-primary-200">Settings</h2>
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                        <Link href="/admin/profile">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" asChild>
                        <Link href="/admin/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Site Settings
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-white hover:bg-white/10"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 flex items-center justify-between md:justify-start gap-4">
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary-800">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-primary-900">{stats.totalUsers}</div>
                <p className="text-xs text-primary-700">{stats.pendingApprovals} pending approval</p>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary-800">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-primary-900">${stats.totalBalance.toFixed(2)}</div>
                <p className="text-xs text-primary-700">Across all accounts</p>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary-800">Transactions Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-primary-900">{stats.transactionsToday}</div>
                <p className="text-xs text-primary-700">{formatDate(new Date().toISOString())}</p>
              </CardContent>
            </Card>
            <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50"
                  onClick={() => setIsAddTransactionOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Transaction
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50"
                  onClick={() => setIsPendingApprovalsOpen(true)}
                >
                  Approvals
                </Button>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-lg sm:text-xl font-bold mb-4 bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
            Account Overview
          </h2>
          <Card className="mb-6 sm:mb-8 backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-primary-50/50">
                      <th className="text-left p-2 sm:p-4 text-primary-800">User</th>
                      <th className="text-left p-2 sm:p-4 text-primary-800 hidden md:table-cell">Account #</th>
                      <th className="text-right p-2 sm:p-4 text-primary-800">Balance</th>
                      <th className="text-center p-2 sm:p-4 text-primary-800 hidden sm:table-cell">Status</th>
                      <th className="text-left p-2 sm:p-4 text-primary-800 hidden lg:table-cell">Last Login</th>
                      <th className="text-center p-2 sm:p-4 text-primary-800 hidden md:table-cell">2FA</th>
                      <th className="text-center p-2 sm:p-4 text-primary-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="p-2 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-primary-100">
                              <AvatarFallback className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm text-primary-900">{user.name}</div>
                              <div className="text-xs text-primary-600 hidden sm:block">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 sm:p-4 font-mono text-xs hidden md:table-cell text-primary-700">
                          {user.accountNumber}
                        </td>
                        <td className="p-2 sm:p-4 text-right font-medium text-sm text-primary-900">
                          ${user.balance.toFixed(2)}
                        </td>
                        <td className="p-2 sm:p-4 text-center hidden sm:table-cell">
                          <Badge
                            variant={
                              user.status === "active"
                                ? "default"
                                : user.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              user.status === "active"
                                ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                                : user.status === "pending"
                                ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                                : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                            }
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-2 sm:p-4 text-xs hidden lg:table-cell text-primary-700">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td className="p-2 sm:p-4 text-center hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className={
                              user.twoFactorEnabled
                                ? "bg-green-50 text-green-600 border-green-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            }
                          >
                            {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </td>
                        <td className="p-2 sm:p-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary-600 hover:text-primary-800 hover:bg-primary-50"
                            asChild
                          >
                            <Link href={`/admin/users/${user.id}`}>Manage</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-lg sm:text-xl font-bold mb-4 bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
            Recent Transactions
          </h2>
          <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-primary-50/50">
                      <th className="text-left p-2 sm:p-4 text-primary-800">ID</th>
                      <th className="text-left p-2 sm:p-4 text-primary-800">User</th>
                      <th className="text-left p-2 sm:p-4 text-primary-800 hidden md:table-cell">Type</th>
                      <th className="text-right p-2 sm:p-4 text-primary-800">Amount</th>
                      <th className="text-left p-2 sm:p-4 text-primary-800 hidden lg:table-cell">Description</th>
                      <th className="text-left p-2 sm:p-4 text-primary-800 hidden md:table-cell">Date</th>
                      <th className="text-center p-2 sm:p-4 text-primary-800 hidden sm:table-cell">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {transactions.slice(0, 5).map((transaction) => {
                      const user = users.find((u) => u.id === transaction.userId)
                      return (
                        <tr key={transaction.id} className="hover:bg-primary-50/50 transition-colors">
                          <td className="p-2 sm:p-4 font-mono text-xs text-primary-700">{transaction.id}</td>
                          <td className="p-2 sm:p-4 text-sm text-primary-900">{user?.name || "Unknown User"}</td>
                          <td className="p-2 sm:p-4 capitalize hidden md:table-cell text-primary-900">
                            {transaction.type}
                          </td>
                          <td
                            className={`p-2 sm:p-4 text-right font-medium text-sm ${
                              transaction.amount > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                          </td>
                          <td className="p-2 sm:p-4 text-sm hidden lg:table-cell text-primary-900">
                            {transaction.description}
                          </td>
                          <td className="p-2 sm:p-4 text-xs hidden md:table-cell text-primary-700">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="p-2 sm:p-4 text-center hidden sm:table-cell">
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
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50"
                  asChild
                >
                  <Link href="/admin/transactions">View All Transactions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md bg-white/95 backdrop-blur-sm border border-primary-100">
          <DialogHeader>
            <DialogTitle className="text-primary-900">Add New Transaction</DialogTitle>
            <DialogDescription className="text-primary-600">
              Create a new transaction for a user&apos;s account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 px-2 sm:px-0">
            {transactionError && <div className="text-red-600 text-sm">{transactionError}</div>}
            <div className="space-y-2">
              <Label htmlFor="user" className="text-primary-800">
                Select User
              </Label>
              <select
                id="user"
                className="w-full rounded-md border border-primary-200 bg-white/80 px-3 py-2 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                value={newTransaction.userId}
                onChange={(e) => setNewTransaction({ ...newTransaction, userId: e.target.value })}
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.accountNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type" className="text-primary-800">
                Transaction Type
              </Label>
              <select
                id="type"
                className="w-full rounded-md border border-primary-200 bg-white/80 px-3 py-2 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                value={newTransaction.type}
                onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
              >
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="transfer">Transfer</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-primary-800">
                Amount
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600">$</div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  className="pl-7 border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  placeholder="0.00"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-primary-800">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter transaction description"
                className="border-primary-200 bg-white/80 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-primary-200 text-primary-700 hover:bg-primary-50"
              onClick={() => {
                setIsAddTransactionOpen(false)
                setTransactionError(null)
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
              onClick={handleAddTransaction}
            >
              Create Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Approvals Dialog */}
      <Dialog open={isPendingApprovalsOpen} onOpenChange={setIsPendingApprovalsOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg bg-white/95 backdrop-blur-sm border border-primary-100">
          <DialogHeader>
            <DialogTitle className="text-primary-900">Pending Approvals</DialogTitle>
            <DialogDescription className="text-primary-600">
              Review and approve new user registrations.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {pendingUsers.length > 0 ? (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user._id} className="border rounded-lg p-4 space-y-4 bg-white/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary-100">
                          <AvatarFallback className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                            {user.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-primary-900">{user.fullName}</div>
                          <div className="text-sm text-primary-600">{user.email}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="text-primary-700">
                        <span className="text-primary-500">Username:</span> {user.username || "Not set"}
                      </div>
                      <div className="text-primary-700">
                        <span className="text-primary-500">Phone:</span> {user.phone}
                      </div>
                      <div className="text-primary-700">
                        <span className="text-primary-500">SSN:</span> {user.ssn}
                      </div>
                      <div className="text-primary-700">
                        <span className="text-primary-500">Address:</span>{" "}
                        {`${user.streetAddress}, ${user.city}, ${user.state} ${user.zipCode}`}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        size="sm"
                        disabled
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                        onClick={() => handleApproveUser(user._id)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-primary-600">No pending approvals</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
              onClick={() => setIsPendingApprovalsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}