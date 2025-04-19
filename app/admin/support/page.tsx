"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpDown, CheckCircle2, Filter, HelpCircle, MessageSquare, Search, Send, User, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SupportTicket {
  id: string
  userId: string
  userName: string
  userEmail: string
  accountNumber: string
  subject: string
  message: string
  category: "account" | "transaction" | "technical" | "security" | "other"
  status: "open" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  createdAt: string
  updatedAt: string
  responses: TicketResponse[]
}

interface TicketResponse {
  id: string
  ticketId: string
  message: string
  isAdmin: boolean
  createdAt: string
}

export default function AdminSupportPage() {
  const router = useRouter()

  // Sample support tickets data
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: "ticket-001",
      userId: "user-001",
      userName: "John Doe",
      userEmail: "john@example.com",
      accountNumber: "1000-2000-3000",
      subject: "Cannot access my account",
      message:
        "I've been trying to log in to my account for the past 2 days but keep getting an error message saying 'Invalid credentials'. I'm sure I'm using the correct password. Can you please help?",
      category: "account",
      status: "open",
      priority: "high",
      createdAt: "2025-03-15 09:23:45",
      updatedAt: "2025-03-15 09:23:45",
      responses: [],
    },
    {
      id: "ticket-002",
      userId: "user-002",
      userName: "Sarah Smith",
      userEmail: "sarah@example.com",
      accountNumber: "1000-2000-3001",
      subject: "Missing transaction",
      message:
        "I made a deposit of $500 yesterday at the ATM but it's not showing up in my account. The receipt number is #AT78901234. Please investigate this issue.",
      category: "transaction",
      status: "in_progress",
      priority: "medium",
      createdAt: "2025-03-14 15:42:10",
      updatedAt: "2025-03-15 10:15:22",
      responses: [
        {
          id: "resp-001",
          ticketId: "ticket-002",
          message:
            "Thank you for reporting this issue. We're looking into it and will get back to you shortly. Could you please provide the exact time of the transaction?",
          isAdmin: true,
          createdAt: "2025-03-15 10:15:22",
        },
        {
          id: "resp-002",
          ticketId: "ticket-002",
          message:
            "The transaction was made at approximately 2:30 PM. I have the receipt with me if you need more details.",
          isAdmin: false,
          createdAt: "2025-03-15 11:05:17",
        },
      ],
    },
    {
      id: "ticket-003",
      userId: "user-003",
      userName: "Mike Brown",
      userEmail: "mike@example.com",
      accountNumber: "1000-2000-3002",
      subject: "App keeps crashing",
      message:
        "The mobile app keeps crashing whenever I try to view my transaction history. I'm using an iPhone 14 with the latest iOS update. This has been happening for about a week now.",
      category: "technical",
      status: "open",
      priority: "low",
      createdAt: "2025-03-13 17:30:55",
      updatedAt: "2025-03-13 17:30:55",
      responses: [],
    },
    {
      id: "ticket-004",
      userId: "user-001",
      userName: "John Doe",
      userEmail: "john@example.com",
      accountNumber: "1000-2000-3000",
      subject: "Suspicious activity on my account",
      message:
        "I noticed some transactions I didn't make on my account. There are three withdrawals of $50 each made yesterday from an ATM I never use. I think my card might have been compromised.",
      category: "security",
      status: "in_progress",
      priority: "urgent",
      createdAt: "2025-03-15 08:12:33",
      updatedAt: "2025-03-15 08:45:10",
      responses: [
        {
          id: "resp-003",
          ticketId: "ticket-004",
          message:
            "We take security concerns very seriously. I've temporarily frozen your account to prevent any further unauthorized transactions. Our security team is investigating these transactions. We'll contact you shortly with more information.",
          isAdmin: true,
          createdAt: "2025-03-15 08:45:10",
        },
      ],
    },
    {
      id: "ticket-005",
      userId: "user-004",
      userName: "Emma Wilson",
      userEmail: "emma@example.com",
      accountNumber: "1000-2000-3003",
      subject: "Question about fees",
      message:
        "I was charged a $35 overdraft fee, but I thought I had overdraft protection enabled on my account. Can you explain why this happened and how I can avoid it in the future?",
      category: "account",
      status: "resolved",
      priority: "medium",
      createdAt: "2025-03-12 13:20:45",
      updatedAt: "2025-03-14 11:30:15",
      responses: [
        {
          id: "resp-004",
          ticketId: "ticket-005",
          message:
            "I've checked your account and while you do have overdraft protection, it only applies to transfers from your savings account. At the time of the overdraft, your savings account didn't have sufficient funds to cover the transaction. I'd be happy to explain your options to avoid this in the future.",
          isAdmin: true,
          createdAt: "2025-03-13 09:15:30",
        },
        {
          id: "resp-005",
          ticketId: "ticket-005",
          message:
            "Thank you for the explanation. Could you please tell me what other overdraft protection options are available?",
          isAdmin: false,
          createdAt: "2025-03-13 14:22:10",
        },
        {
          id: "resp-006",
          ticketId: "ticket-005",
          message:
            "You have several options: 1) Maintain a higher balance in your savings account, 2) Set up low balance alerts, 3) Link a credit card as backup, or 4) Opt out of overdraft coverage entirely (transactions would be declined instead). I've waived the recent overdraft fee as a courtesy. Would you like to make any changes to your current setup?",
          isAdmin: true,
          createdAt: "2025-03-14 11:30:15",
        },
      ],
    },
  ])

  // Filter and search state
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Selected ticket state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)

  // Response state
  const [newResponse, setNewResponse] = useState<string>("")

  // Status update dialog state
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState<boolean>(false)
  const [newStatus, setNewStatus] = useState<string>("")

  // Filter tickets based on current filters and search
  const filteredTickets = tickets.filter((ticket) => {
    // Status filter
    if (filterStatus !== "all" && ticket.status !== filterStatus) {
      return false
    }

    // Priority filter
    if (filterPriority !== "all" && ticket.priority !== filterPriority) {
      return false
    }

    // Category filter
    if (filterCategory !== "all" && ticket.category !== filterCategory) {
      return false
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        ticket.userName.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.message.toLowerCase().includes(query) ||
        ticket.accountNumber.includes(query)
      )
    }

    return true
  })

  // Sort tickets by priority and date
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    // First sort by status (open first)
    if (a.status === "open" && b.status !== "open") return -1
    if (a.status !== "open" && b.status === "open") return 1

    // Then by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }

    // Finally by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  // Handle sending a response
  const handleSendResponse = () => {
    if (!selectedTicket || !newResponse.trim()) return

    const response: TicketResponse = {
      id: `resp-${Date.now()}`,
      ticketId: selectedTicket.id,
      message: newResponse,
      isAdmin: true,
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 19),
    }

    // Update the ticket with the new response
    const updatedTickets = tickets.map((ticket) => {
      if (ticket.id === selectedTicket.id) {
        return {
          ...ticket,
          responses: [...ticket.responses, response],
          updatedAt: response.createdAt,
          status: ticket.status === "open" ? "in_progress" : ticket.status,
        }
      }
      return ticket
    })

    setTickets(updatedTickets)
    setSelectedTicket({
      ...selectedTicket,
      responses: [...selectedTicket.responses, response],
      updatedAt: response.createdAt,
      status: selectedTicket.status === "open" ? "in_progress" : selectedTicket.status,
    })
    setNewResponse("")
  }

  // Handle updating ticket status
  const handleUpdateStatus = () => {
    if (!selectedTicket || !newStatus) return

    const updatedTickets = tickets.map((ticket) => {
      if (ticket.id === selectedTicket.id) {
        return {
          ...ticket,
          status: newStatus as any,
          updatedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
        }
      }
      return ticket
    })

    setTickets(updatedTickets)
    setSelectedTicket({
      ...selectedTicket,
      status: newStatus as any,
      updatedAt: new Date().toISOString().replace("T", " ").substring(0, 19),
    })
    setIsStatusDialogOpen(false)
  }

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Open</Badge>
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>
      case "closed":
        return <Badge variant="outline">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "high":
        return <Badge className="bg-orange-500">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-500">Medium</Badge>
      case "low":
        return <Badge className="bg-green-500">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  // Get category badge variant
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "account":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Account
          </Badge>
        )
      case "transaction":
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
            Transaction
          </Badge>
        )
      case "technical":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            Technical
          </Badge>
        )
      case "security":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            Security
          </Badge>
        )
      case "other":
        return <Badge variant="outline">Other</Badge>
      default:
        return <Badge variant="outline">{category}</Badge>
    }
  }

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString.replace(" ", "T"))
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? "s" : ""} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="flex h-screen">
        {/* Ticket List */}
        <div
          className={`border-r border-indigo-100 ${selectedTicket ? "hidden md:block md:w-1/3 lg:w-2/5" : "w-full"}`}
        >
          <div className="p-4 border-b border-indigo-100">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-4">
              Customer Support
            </h1>

            {/* Search and Filter */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-indigo-600" />
                <Input
                  type="search"
                  placeholder="Search tickets..."
                  className="pl-8 border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[110px] border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Ticket List */}
          <div className="divide-y overflow-auto" style={{ maxHeight: "calc(100vh - 12rem)" }}>
            {sortedTickets.length > 0 ? (
              sortedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 hover:bg-indigo-50/50 cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id ? "bg-indigo-50/50" : ""
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium truncate mr-2 text-indigo-900">{ticket.subject}</div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-indigo-600 mb-2">
                    <User className="h-3.5 w-3.5" />
                    <span>{ticket.userName}</span>
                    <span>•</span>
                    <span className="font-mono">{ticket.accountNumber}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1">{getCategoryBadge(ticket.category)}</div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>{ticket.responses.length}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(ticket.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-indigo-600">
                <HelpCircle className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No tickets match your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        {selectedTicket ? (
          <div className={`flex flex-col h-full ${selectedTicket ? "w-full md:w-2/3 lg:w-3/5" : "hidden"}`}>
            {/* Ticket Header */}
            <div className="p-4 border-b border-indigo-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100"
                  onClick={() => setSelectedTicket(null)}
                >
                  Back
                </Button>
                <h2 className="font-bold truncate text-indigo-900">{selectedTicket.subject}</h2>
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                    >
                      {getStatusBadge(selectedTicket.status)}
                      <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setNewStatus("open")
                        setIsStatusDialogOpen(true)
                      }}
                    >
                      <Badge variant="default" className="mr-2">
                        Open
                      </Badge>
                      Mark as Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setNewStatus("in_progress")
                        setIsStatusDialogOpen(true)
                      }}
                    >
                      <Badge variant="secondary" className="mr-2">
                        In Progress
                      </Badge>
                      Mark as In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setNewStatus("resolved")
                        setIsStatusDialogOpen(true)
                      }}
                    >
                      <Badge className="bg-green-500 mr-2">Resolved</Badge>
                      Mark as Resolved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setNewStatus("closed")
                        setIsStatusDialogOpen(true)
                      }}
                    >
                      <Badge variant="outline" className="mr-2">
                        Closed
                      </Badge>
                      Mark as Closed
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Ticket Info */}
            <div className="p-4 border-b border-indigo-100 bg-indigo-50/50">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-indigo-600">From:</span>{" "}
                  <span className="font-medium text-indigo-900">{selectedTicket.userName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-medium">{selectedTicket.userEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Account:</span>{" "}
                  <span className="font-medium font-mono">{selectedTicket.accountNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  <span className="font-medium">
                    {new Date(selectedTicket.createdAt.replace(" ", "T")).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Priority:</span> {getPriorityBadge(selectedTicket.priority)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Category:</span> {getCategoryBadge(selectedTicket.category)}
                </div>
              </div>
            </div>

            {/* Conversation */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Initial message */}
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 mt-1">
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">
                    {selectedTicket.userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="font-medium text-indigo-800 mb-1">{selectedTicket.userName}</div>
                    <div className="whitespace-pre-wrap text-indigo-900">{selectedTicket.message}</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 ml-2">
                    {new Date(selectedTicket.createdAt.replace(" ", "T")).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Responses */}
              {selectedTicket.responses.map((response) => (
                <div key={response.id} className="flex gap-4">
                  {response.isAdmin ? (
                    <>
                      <Avatar className="h-10 w-10 mt-1 order-last">
                        <AvatarFallback className="bg-gray-100 text-gray-600">AD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg p-4 ml-auto">
                          <div className="font-medium text-gray-800 mb-1">Support Agent</div>
                          <div className="whitespace-pre-wrap">{response.message}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 ml-2 text-right">
                          {new Date(response.createdAt.replace(" ", "T")).toLocaleString()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Avatar className="h-10 w-10 mt-1">
                        <AvatarFallback className="bg-indigo-100 text-indigo-600">
                          {selectedTicket.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-indigo-50 rounded-lg p-4">
                          <div className="font-medium text-indigo-800 mb-1">{selectedTicket.userName}</div>
                          <div className="whitespace-pre-wrap text-indigo-900">{response.message}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 ml-2">
                          {new Date(response.createdAt.replace(" ", "T")).toLocaleString()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Box */}
            <div className="p-4 border-t border-indigo-100">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your response..."
                  className="min-h-[100px] border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                />
              </div>
              <div className="flex justify-between mt-3">
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                      >
                        <Filter className="mr-2 h-3.5 w-3.5" />
                        Templates
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Response Templates</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setNewResponse(
                            "Thank you for contacting our support team. We're looking into your issue and will get back to you as soon as possible.",
                          )
                        }
                      >
                        Acknowledgement
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setNewResponse(
                            "We've resolved your issue. Please let us know if you need any further assistance.",
                          )
                        }
                      >
                        Resolution
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setNewResponse(
                            "Could you please provide more information about the issue you're experiencing? This will help us assist you better.",
                          )
                        }
                      >
                        Request More Info
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setNewResponse(
                            "For security reasons, we need to verify your identity. Please provide the last 4 digits of your SSN and your date of birth.",
                          )
                        }
                      >
                        Identity Verification
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button
                  onClick={handleSendResponse}
                  disabled={!newResponse.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Response
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center w-2/3 lg:w-3/5 p-8 text-center text-indigo-600">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <h2 className="text-xl font-medium text-indigo-900 mb-2">Select a ticket to view details</h2>
            <p>No ticket selected. Choose a ticket from the list to view and respond.</p>
          </div>
        )}

        {/* Status Update Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="bg-white/95 backdrop-blur-sm border border-indigo-100">
            <DialogHeader>
              <DialogTitle className="text-indigo-900">Update Ticket Status</DialogTitle>
              <DialogDescription className="text-indigo-600">
                Are you sure you want to change the status of this ticket?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center gap-4">
                <div className="font-medium">Current Status:</div>
                {selectedTicket && getStatusBadge(selectedTicket.status)}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="font-medium">New Status:</div>
                {newStatus && getStatusBadge(newStatus)}
              </div>

              {newStatus === "resolved" && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Marking as resolved will:</p>
                      <ul className="mt-2 text-sm text-green-700 list-disc list-inside">
                        <li>Notify the customer that their issue has been resolved</li>
                        <li>Allow them to reopen the ticket if needed</li>
                        <li>Move the ticket to the resolved queue</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {newStatus === "closed" && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-800">Marking as closed will:</p>
                      <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                        <li>Permanently close this support ticket</li>
                        <li>Archive it from active tickets</li>
                        <li>Require the customer to create a new ticket for further assistance</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
                className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
