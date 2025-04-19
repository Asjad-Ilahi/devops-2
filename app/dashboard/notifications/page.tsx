"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, Check, CreditCard, Filter, Info, Loader2, Lock, Search, Shield, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Notification {
  id: string
  title: string
  message: string
  date: string
  type: "security" | "transaction" | "account" | "system"
  read: boolean
}

export default function NotificationsPage() {
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "notif-001",
      title: "Security Alert",
      message: "Your password was changed successfully.",
      date: "2025-03-14 10:15:30",
      type: "security",
      read: false,
    },
    {
      id: "notif-002",
      title: "Money Received",
      message: "You received $125.00 from John Doe.",
      date: "2025-03-13 14:22:10",
      type: "transaction",
      read: false,
    },
    {
      id: "notif-003",
      title: "New Feature",
      message: "Check out our new crypto wallet feature!",
      date: "2025-03-12 09:30:45",
      type: "system",
      read: true,
    },
    {
      id: "notif-004",
      title: "Login Attempt",
      message: "Unsuccessful login attempt detected from an unknown device.",
      date: "2025-03-11 18:45:22",
      type: "security",
      read: true,
    },
    {
      id: "notif-005",
      title: "Transaction Completed",
      message: "Your transfer of $50.00 to Sarah Smith was completed.",
      date: "2025-03-10 11:20:15",
      type: "transaction",
      read: true,
    },
    {
      id: "notif-006",
      title: "Account Statement",
      message: "Your February 2025 statement is now available.",
      date: "2025-03-01 00:00:00",
      type: "account",
      read: true,
    },
    {
      id: "notif-007",
      title: "Security Tip",
      message: "Remember to update your password regularly for enhanced security.",
      date: "2025-02-28 15:30:00",
      type: "security",
      read: true,
    },
    {
      id: "notif-008",
      title: "Low Balance Alert",
      message: "Your checking account balance is below $500.",
      date: "2025-02-25 09:15:30",
      type: "account",
      read: true,
    },
  ])

  // Filters state
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [readFilter, setReadFilter] = useState<string>("all")

  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    // Type filter
    if (typeFilter !== "all" && notification.type !== typeFilter) {
      return false
    }

    // Read filter
    if (readFilter === "read" && !notification.read) {
      return false
    } else if (readFilter === "unread" && notification.read) {
      return false
    }

    // Search term filter
    if (
      searchTerm &&
      !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }

    return true
  })

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  // Mark all as read
  const markAllAsRead = async () => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))

      setSuccess("All notifications marked as read")

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setReadFilter("all")
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "security":
        return <Shield className="h-5 w-5 text-red-600" />
      case "transaction":
        return <CreditCard className="h-5 w-5 text-green-600" />
      case "account":
        return <Info className="h-5 w-5 text-blue-600" />
      case "system":
        return <Bell className="h-5 w-5 text-purple-600" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  // Get notification badge based on type
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "security":
        return <Badge variant="destructive">Security</Badge>
      case "transaction":
        return <Badge variant="default">Transaction</Badge>
      case "account":
        return <Badge variant="secondary">Account</Badge>
      case "system":
        return <Badge variant="outline">System</Badge>
      default:
        return <Badge variant="outline">Notification</Badge>
    }
  }

  // Count unread notifications
  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 mb-2">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6">
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "All caught up!"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={isLoading || unreadCount === 0}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Mark All as Read"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search notifications..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={resetFilters}>
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="all" onValueChange={setTypeFilter}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="transaction">Transactions</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                  </TabsList>

                  <div className="flex justify-end mb-4">
                    <Tabs value={readFilter} onValueChange={setReadFilter} className="w-auto">
                      <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">Unread</TabsTrigger>
                        <TabsTrigger value="read">Read</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-4">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border rounded-lg ${notification.read ? "bg-background" : "bg-muted/50"}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium">{notification.title}</div>
                                  <div className="text-sm text-muted-foreground">{notification.message}</div>
                                </div>
                                {getNotificationBadge(notification.type)}
                              </div>
                              <div className="mt-2 flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                  {new Date(notification.date).toLocaleString()}
                                </div>
                                {!notification.read && (
                                  <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                                    Mark as Read
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                          <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                        <p className="text-muted-foreground">
                          {searchTerm || typeFilter !== "all" || readFilter !== "all"
                            ? "Try adjusting your filters to see more results"
                            : "You're all caught up!"}
                        </p>
                      </div>
                    )}
                  </div>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredNotifications.length} of {notifications.length} notifications
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/notifications/settings">Notification Settings</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Settings</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Security Alerts</h3>
                    <p className="text-sm text-muted-foreground">Get notified about security events</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Transaction Alerts</h3>
                    <p className="text-sm text-muted-foreground">Get notified about transactions</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Account Alerts</h3>
                    <p className="text-sm text-muted-foreground">Get notified about account changes</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">System Notifications</h3>
                    <p className="text-sm text-muted-foreground">Get notified about system updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/dashboard/notifications/settings">Manage All Settings</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Center</CardTitle>
                <CardDescription>Review your security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">Enabled</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Login Notifications</div>
                    <div className="text-sm text-muted-foreground">Enabled</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium">Transaction Alerts</div>
                    <div className="text-sm text-muted-foreground">Disabled</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/profile">
                    <Lock className="mr-2 h-4 w-4" />
                    Security Settings
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
