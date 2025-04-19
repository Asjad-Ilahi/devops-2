"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Loader2, MoreHorizontal, Plus, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

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
  createdAt: string
}

export default function UsersPage() {
  // Users state
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // Added error state

  // Filters state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [twoFactorFilter, setTwoFactorFilter] = useState<string>("all")

  // Bulk actions state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)

  // Load users from API
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/admin/users", {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to fetch users")
        }

        const data = await response.json()
        const formattedUsers: User[] = data.users.map((user: any) => ({
          id: user._id || user.id,
          name: user.name || user.fullName || "Unknown",
          username: user.username || "N/A",
          email: user.email || "N/A",
          accountNumber: user.accountNumber || "N/A",
          balance: user.balance || 0,
          status: user.status || "pending",
          twoFactorEnabled: user.twoFactorEnabled || false,
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A",
          createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A",
        }))
        setUsers(formattedUsers)
        setFilteredUsers(formattedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
        setError(error instanceof Error ? error.message : "Failed to load users")
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = [...users]

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.accountNumber.includes(searchTerm),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter)
    }

    // Two-factor filter
    if (twoFactorFilter !== "all") {
      const isEnabled = twoFactorFilter === "enabled"
      filtered = filtered.filter((user) => user.twoFactorEnabled === isEnabled)
    }

    setFilteredUsers(filtered)
  }, [searchTerm, statusFilter, twoFactorFilter, users])

  // Handle user selection
  const handleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id))
    }
  }

  // Handle bulk approve with API call
  const handleBulkApprove = async () => {
    try {
      const response = await fetch("/api/admin/users/bulk-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userIds: selectedUsers }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to approve users")
      }

      setUsers((prev) =>
        prev.map((user) =>
          selectedUsers.includes(user.id) && user.status === "pending"
            ? { ...user, status: "active" }
            : user,
        ),
      )
      setSelectedUsers([])
      setIsApproveDialogOpen(false)
    } catch (error) {
      console.error("Error approving users:", error)
      setError(error instanceof Error ? error.message : "Failed to approve users")
    }
  }

  // Handle bulk suspend (simulated, as in original Code-01)
  const handleBulkSuspend = () => {
    setUsers((prev) =>
      prev.map((user) =>
        selectedUsers.includes(user.id) && user.status === "active"
          ? { ...user, status: "suspended" }
          : user,
      ),
    )
    setSelectedUsers([])
    setIsSuspendDialogOpen(false)
  }

  // Handle user status change with API call
  const handleStatusChange = async (
    userId: string,
    newStatus: "active" | "suspended" | "pending",
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update user status")
      }

      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)),
      )
    } catch (error) {
      console.error("Error updating user status:", error)
      setError(error instanceof Error ? error.message : "Failed to update user status")
    }
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTwoFactorFilter("all")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
          User Management
        </h1>

        {/* Filters */}
        <Card className="mb-6 backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-indigo-900">Users</CardTitle>
                <CardDescription className="text-indigo-600">Manage user accounts and permissions</CardDescription>
              </div>
              <Button
                asChild
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Link href="/admin/users/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-indigo-600" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8 border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={twoFactorFilter} onValueChange={setTwoFactorFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="2FA Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All 2FA Status</SelectItem>
                    <SelectItem value="enabled">2FA Enabled</SelectItem>
                    <SelectItem value="disabled">2FA Disabled</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={resetFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex items-center justify-between p-2 bg-muted rounded-md mb-4">
                <div className="text-sm">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""} selected
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsApproveDialogOpen(true)}
                    disabled={!selectedUsers.some((id) => users.find((user) => user.id === id)?.status === "pending")}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSuspendDialogOpen(true)}
                    disabled={!selectedUsers.some((id) => users.find((user) => user.id === id)?.status === "active")}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Suspend
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-indigo-50/50">
                    <th className="text-left p-4 w-[40px] text-indigo-800">
                      <Checkbox
                        checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all users"
                      />
                    </th>
                    <th className="text-left p-4 text-indigo-800">User</th>
                    <th className="text-left p-4 text-indigo-800">Account #</th>
                    <th className="text-right p-4 text-indigo-800">Balance</th>
                    <th className="text-center p-4 text-indigo-800">Status</th>
                    <th className="text-center p-4 text-indigo-800">2FA</th>
                    <th className="text-left p-4 text-indigo-800">Created</th>
                    <th className="text-left p-4 text-indigo-800">Last Login</th>
                    <th className="text-center p-4 text-indigo-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleUserSelection(user.id)}
                          aria-label={`Select ${user.name}`}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border-2 border-indigo-100">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-indigo-900">{user.name}</div>
                            <div className="text-sm text-indigo-600">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">{user.accountNumber}</td>
                      <td className="p-4 text-right font-medium">${user.balance.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={
                            user.status === "active"
                              ? "default"
                              : user.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        {user.twoFactorEnabled ? (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                            Disabled
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm">{user.createdAt}</td>
                      <td className="p-4 text-sm">{user.lastLogin}</td>
                      <td className="p-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            {user.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user.id, "active")}>
                                Approve User
                              </DropdownMenuItem>
                            )}
                            {user.status === "active" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user.id, "suspended")}>
                                Suspend User
                              </DropdownMenuItem>
                            )}
                            {user.status === "suspended" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user.id, "active")}>
                                Reactivate User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}/transactions`}>View Transactions</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-muted-foreground">
                        No users found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Approve Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-sm border border-indigo-100">
            <DialogHeader>
              <DialogTitle className="text-indigo-900">Approve Users</DialogTitle>
              <DialogDescription className="text-indigo-600">
                Are you sure you want to approve the selected users? This will change their status to "Active".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="text-sm">
                {selectedUsers.filter((id) => users.find((user) => user.id === id)?.status === "pending").length}{" "}
                user(s) will be approved.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkApprove}>Approve Users</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend Dialog */}
        <Dialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend Users</DialogTitle>
              <DialogDescription>
                Are you sure you want to suspend the selected users? This will change their status to "Suspended".
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="text-sm">
                {selectedUsers.filter((id) => users.find((user) => user.id === id)?.status === "active").length} user(s)
                will be suspended.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSuspendDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleBulkSuspend}>
                Suspend Users
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}