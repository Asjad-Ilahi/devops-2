"use client"

import { Switch } from "@/components/ui/switch"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Download, FileText, Filter, Printer, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

interface Statement {
  id: string
  account: string
  period: string
  date: string
  size: string
  status: "available" | "processing" | "archived"
}

export default function StatementsPage() {
  // Filters state
  const [searchTerm, setSearchTerm] = useState("")
  const [accountFilter, setAccountFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })

  // Statements data
  const statements: Statement[] = [
    {
      id: "stmt-2025-03",
      account: "Checking",
      period: "March 2025",
      date: "2025-04-01",
      size: "1.2 MB",
      status: "available",
    },
    {
      id: "stmt-2025-02",
      account: "Checking",
      period: "February 2025",
      date: "2025-03-01",
      size: "1.5 MB",
      status: "available",
    },
    {
      id: "stmt-2025-01",
      account: "Checking",
      period: "January 2025",
      date: "2025-02-01",
      size: "1.3 MB",
      status: "available",
    },
    {
      id: "stmt-2024-12",
      account: "Checking",
      period: "December 2024",
      date: "2025-01-01",
      size: "1.4 MB",
      status: "available",
    },
    {
      id: "stmt-2024-11",
      account: "Checking",
      period: "November 2024",
      date: "2024-12-01",
      size: "1.1 MB",
      status: "available",
    },
    {
      id: "stmt-2024-10",
      account: "Checking",
      period: "October 2024",
      date: "2024-11-01",
      size: "1.2 MB",
      status: "available",
    },
    {
      id: "stmt-2025-03-s",
      account: "Savings",
      period: "March 2025",
      date: "2025-04-01",
      size: "0.9 MB",
      status: "available",
    },
    {
      id: "stmt-2025-02-s",
      account: "Savings",
      period: "February 2025",
      date: "2025-03-01",
      size: "0.8 MB",
      status: "available",
    },
    {
      id: "stmt-2025-01-s",
      account: "Savings",
      period: "January 2025",
      date: "2025-02-01",
      size: "0.7 MB",
      status: "available",
    },
    {
      id: "stmt-2024-12-s",
      account: "Savings",
      period: "December 2024",
      date: "2025-01-01",
      size: "0.8 MB",
      status: "available",
    },
    {
      id: "stmt-2024-11-s",
      account: "Savings",
      period: "November 2024",
      date: "2024-12-01",
      size: "0.7 MB",
      status: "available",
    },
    {
      id: "stmt-2024-10-s",
      account: "Savings",
      period: "October 2024",
      date: "2024-11-01",
      size: "0.8 MB",
      status: "available",
    },
  ]

  // Filter statements
  const filteredStatements = statements.filter((statement) => {
    // Account filter
    if (accountFilter !== "all" && statement.account !== accountFilter) {
      return false
    }

    // Search term filter
    if (searchTerm && !statement.period.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Date range filter
    if (dateRange.from) {
      const statementDate = new Date(statement.date)
      if (statementDate < dateRange.from) {
        return false
      }
    }

    if (dateRange.to) {
      const statementDate = new Date(statement.date)
      if (statementDate > dateRange.to) {
        return false
      }
    }

    return true
  })

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("")
    setAccountFilter("all")
    setDateRange({ from: undefined, to: undefined })
  }

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
          <h1 className="text-2xl font-bold">Account Statements</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Statements</CardTitle>
                <CardDescription>View and download your account statements</CardDescription>
              </div>
              <Button variant="outline" onClick={resetFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search statements..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="Checking">Checking Account</SelectItem>
                  <SelectItem value="Savings">Savings Account</SelectItem>
                </SelectContent>
              </Select>

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
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Tabs defaultValue="statements">
              <TabsList className="mb-4">
                <TabsTrigger value="statements">Statements</TabsTrigger>
                <TabsTrigger value="tax">Tax Documents</TabsTrigger>
                <TabsTrigger value="notices">Notices</TabsTrigger>
              </TabsList>

              <TabsContent value="statements">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Statement Period</th>
                        <th className="text-left p-4">Account</th>
                        <th className="text-left p-4">Date Available</th>
                        <th className="text-left p-4">Size</th>
                        <th className="text-center p-4">Status</th>
                        <th className="text-center p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredStatements.map((statement) => (
                        <tr key={statement.id} className="hover:bg-muted/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span>{statement.period}</span>
                            </div>
                          </td>
                          <td className="p-4">{statement.account}</td>
                          <td className="p-4">{new Date(statement.date).toLocaleDateString()}</td>
                          <td className="p-4">{statement.size}</td>
                          <td className="p-4 text-center">
                            <Badge
                              variant={
                                statement.status === "available"
                                  ? "default"
                                  : statement.status === "processing"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {statement.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                              </Button>
                              <Button variant="outline" size="sm">
                                <Printer className="h-4 w-4" />
                                <span className="sr-only">Print</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredStatements.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-muted-foreground">
                            No statements found matching your filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="tax">
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Tax Documents</h3>
                  <p className="text-muted-foreground mb-4">
                    Your tax documents will be available here when they are ready.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tax documents are typically available by January 31st each year.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="notices">
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Account Notices</h3>
                  <p className="text-muted-foreground mb-4">You have no account notices at this time.</p>
                  <p className="text-sm text-muted-foreground">
                    Important account notices and communications will appear here.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {filteredStatements.length} of {statements.length} statements
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
              <Select defaultValue="pdf">
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Format</SelectItem>
                  <SelectItem value="csv">CSV Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statement Preferences</CardTitle>
            <CardDescription>Manage your statement delivery preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Paperless Statements</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive your statements electronically instead of by mail
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Statement Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive an email when a new statement is available</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Combined Statements</h3>
                  <p className="text-sm text-muted-foreground">Receive a single statement for all your accounts</p>
                </div>
                <Switch />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button>Save Preferences</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
