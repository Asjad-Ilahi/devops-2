"use client"

import { Textarea } from "@/components/ui/textarea"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart, Calendar, Download, LineChart, Loader2, PieChart, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

export default function AdminReportsPage() {
  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  // Report type state
  const [reportType, setReportType] = useState("transactions")

  // Loading state
  const [isLoading, setIsLoading] = useState(false)

  // Handle report generation
  const handleGenerateReport = async () => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
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
            Reports & Analytics
          </h1>
        </div>

        <Card className="mb-6 backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-indigo-900">Generate Reports</CardTitle>
                <CardDescription className="text-indigo-600">
                  Create custom reports for analysis and record-keeping
                </CardDescription>
              </div>
              <Button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <div>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transactions">Transaction Report</SelectItem>
                    <SelectItem value="users">User Activity Report</SelectItem>
                    <SelectItem value="financial">Financial Summary</SelectItem>
                    <SelectItem value="security">Security Audit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
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

              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue placeholder="Export Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Format</SelectItem>
                  <SelectItem value="csv">CSV Format</SelectItem>
                  <SelectItem value="excel">Excel Format</SelectItem>
                  <SelectItem value="json">JSON Format</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="preview">
              <TabsList className="mb-4 bg-indigo-100/70 p-1 rounded-lg">
                <TabsTrigger
                  value="preview"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
                >
                  Preview
                </TabsTrigger>
                <TabsTrigger
                  value="options"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
                >
                  Advanced Options
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
                >
                  Scheduled Reports
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                <div className="border border-indigo-100 rounded-md p-6 backdrop-blur-sm bg-white/60">
                  {reportType === "transactions" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Transaction Report</h3>
                        <p className="text-sm text-muted-foreground">
                          {dateRange.from && dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            "All Time"
                          )}
                        </p>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-3">
                        <Card className="backdrop-blur-sm bg-white/80 border border-indigo-100 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-800">Total Transactions</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-indigo-900">1,248</div>
                            <p className="text-xs text-indigo-600">
                              <span className="text-green-600">↑ 12%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="backdrop-blur-sm bg-white/80 border border-indigo-100 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-800">Total Volume</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-indigo-900">$124,856.78</div>
                            <p className="text-xs text-indigo-600">
                              <span className="text-green-600">↑ 8%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="backdrop-blur-sm bg-white/80 border border-indigo-100 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-indigo-800">Average Transaction</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-indigo-900">$100.05</div>
                            <p className="text-xs text-indigo-600">
                              <span className="text-red-600">↓ 3%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Transaction Volume by Type</CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-center">
                            <div className="h-64 w-full bg-indigo-50/50 rounded-md flex items-center justify-center">
                              <PieChart className="h-8 w-8 text-indigo-400" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Transaction Trend</CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-center">
                            <div className="h-64 w-full bg-indigo-50/50 rounded-md flex items-center justify-center">
                              <LineChart className="h-8 w-8 text-indigo-400" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {reportType === "users" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">User Activity Report</h3>
                        <p className="text-sm text-muted-foreground">
                          {dateRange.from && dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            "All Time"
                          )}
                        </p>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">856</div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-green-600">↑ 5%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">New Users</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">124</div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-green-600">↑ 15%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">632</div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-green-600">↑ 8%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">User Growth</CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-center">
                            <div className="h-64 w-full bg-muted rounded-md flex items-center justify-center">
                              <LineChart className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">User Activity by Time</CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-center">
                            <div className="h-64 w-full bg-muted rounded-md flex items-center justify-center">
                              <BarChart className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {reportType === "financial" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Financial Summary</h3>
                        <p className="text-sm text-muted-foreground">
                          {dateRange.from && dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            "All Time"
                          )}
                        </p>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">$58,432.21</div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-green-600">↑ 7%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">$24,876.50</div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-red-600">↑ 4%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">$33,555.71</div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-green-600">↑ 9%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Revenue vs Expenses</CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-center">
                            <div className="h-64 w-full bg-muted rounded-md flex items-center justify-center">
                              <BarChart className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Profit Margin Trend</CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-center">
                            <div className="h-64 w-full bg-muted rounded-md flex items-center justify-center">
                              <LineChart className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {reportType === "security" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Security Audit Report</h3>
                        <p className="text-sm text-muted-foreground">
                          {dateRange.from && dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            "All Time"
                          )}
                        </p>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-3">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Login Attempts</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">2,456</div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-green-600">↑ 12%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">187</div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-red-600">↑ 23%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">12</div>
                            <p className="text-xs text-muted-foreground">
                              <span className="text-green-600">↓ 8%</span> from previous period
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Login Activity by Time</CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-center">
                            <div className="h-64 w-full bg-muted rounded-md flex items-center justify-center">
                              <LineChart className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm font-medium">Security Incidents by Type</CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-center">
                            <div className="h-64 w-full bg-muted rounded-md flex items-center justify-center">
                              <PieChart className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="options">
                <div className="border rounded-md p-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Include Charts</Label>
                      <Select defaultValue="yes">
                        <SelectTrigger>
                          <SelectValue placeholder="Include Charts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Data Granularity</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue placeholder="Data Granularity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Include Summary</Label>
                      <Select defaultValue="yes">
                        <SelectTrigger>
                          <SelectValue placeholder="Include Summary" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Include Raw Data</Label>
                      <Select defaultValue="yes">
                        <SelectTrigger>
                          <SelectValue placeholder="Include Raw Data" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea placeholder="Add any additional notes or context for this report" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scheduled">
                <div className="border rounded-md p-6">
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Scheduled Reports</h3>
                    <p className="text-muted-foreground mb-4">You haven't set up any scheduled reports yet.</p>
                    <Button>Schedule New Report</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-indigo-600">
              Reports are generated based on the data available in the system.
            </div>
            <Button
              variant="outline"
              className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </CardFooter>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-indigo-900">Saved Reports</CardTitle>
              <CardDescription className="text-indigo-600">Access your previously generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-indigo-100 rounded-md hover:bg-indigo-50/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-indigo-900">Monthly Transaction Report</div>
                      <div className="text-sm text-indigo-600">Generated on March 1, 2025</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-indigo-100 rounded-md hover:bg-indigo-50/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-indigo-900">Q1 Financial Summary</div>
                      <div className="text-sm text-indigo-600">Generated on April 5, 2025</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 border border-indigo-100 rounded-md hover:bg-indigo-50/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-indigo-900">User Growth Analysis</div>
                      <div className="text-sm text-indigo-600">Generated on February 15, 2025</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Use pre-configured report templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Monthly Financial Report</div>
                      <div className="text-sm text-muted-foreground">Comprehensive financial overview</div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">User Activity Dashboard</div>
                      <div className="text-sm text-muted-foreground">User engagement and activity metrics</div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-md hover:bg-muted transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Security Audit Report</div>
                      <div className="text-sm text-muted-foreground">Comprehensive security analysis</div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
