"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Color from "color";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Loader2,
  Search,
  Trash2,
  X,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

// Interface for Colors
interface Colors {
  primaryColor: string;
  secondaryColor: string;
}

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  account: string;
  relatedTransactionId?: string;
}

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  accountNumber: string;
  balance: number;
}

export default function UserTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // State
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<Colors | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<string>("date");

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    description: "",
    amount: "",
    type: "",
    status: "",
    date: "",
  });
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Fetch colors and set CSS custom properties
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch("/api/colors");
        if (!response.ok) throw new Error("Failed to fetch colors");
        const data: Colors = await response.json();
        setColors(data);

        const primary = Color(data.primaryColor);
        const secondary = Color(data.secondaryColor);

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
        });

        const primaryShades = generateShades(primary);
        const secondaryShades = generateShades(secondary);

        Object.entries(primaryShades).forEach(([shade, color]) => {
          document.documentElement.style.setProperty(`--primary-${shade}`, color);
        });

        Object.entries(secondaryShades).forEach(([shade, color]) => {
          document.documentElement.style.setProperty(`--secondary-${shade}`, color);
        });
      } catch (error) {
        console.error("Error fetching colors:", error);
      }
    };
    fetchColors();
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch user and transactions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userRes, transactionsRes] = await Promise.all([
          fetch(`/api/admin/users/${userId}`, { credentials: "include" }),
          fetch(`/api/admin/users/${userId}/transactions`, { credentials: "include" }),
        ]);

        let userData = null;
        if (userRes.ok) {
          const data = await userRes.json();
          userData = data.user;
        }

        if (!transactionsRes.ok) {
          throw new Error("Failed to fetch transactions");
        }
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions);

        // If user fetch failed, fall back to transaction data
        if (!userData && transactionsData.transactions.length > 0) {
          const firstTx = transactionsData.transactions[0];
          userData = {
            id: firstTx.userId,
            fullName: firstTx.userName,
            username: "",
            email: firstTx.userEmail,
            accountNumber: "",
            balance: 0,
          };
        }

        setUser(userData);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load user data and transactions";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, router]);

  // Compute filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (debouncedSearchTerm) {
      result = result.filter(
        (txn) =>
          txn.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          txn.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((txn) => txn.type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((txn) => txn.status === statusFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (dateFilter === "today") {
        result = result.filter((txn) => new Date(txn.date) >= today);
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        result = result.filter((txn) => new Date(txn.date) >= weekAgo);
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        result = result.filter((txn) => new Date(txn.date) >= monthAgo);
      }
    }

    result.sort((a, b) => {
      if (sortField === "date") {
        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortField === "amount") {
        return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      return 0;
    });

    return result;
  }, [transactions, debouncedSearchTerm, typeFilter, statusFilter, dateFilter, sortField, sortDirection]);

  // Compute total pages
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Adjust current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Compute current page items
  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Handle transaction deletion
  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const response = await fetch(`/api/admin/transactions/${transactionToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete transaction");
      }

      setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete));
      if (user) {
        const transaction = transactions.find((t) => t.id === transactionToDelete);
        if (transaction) {
          setUser({ ...user, balance: user.balance - transaction.amount });
        }
      }

      setSuccess("Transaction removed successfully");
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete transaction";
      setError(errorMessage);
    }
  };

  // Handle transaction editing
  const handleEditTransaction = async () => {
    if (!transactionToEdit) return;

    setEditFormError(null);
    const amount = Number.parseFloat(editFormData.amount);
    if (isNaN(amount)) {
      setEditFormError("Please enter a valid amount");
      return;
    }
    if (!editFormData.description) {
      setEditFormError("Description is required");
      return;
    }
    if (!editFormData.date || isNaN(new Date(editFormData.date).getTime())) {
      setEditFormError("Please enter a valid date");
      return;
    }

    try {
      const response = await fetch(`/api/admin/transactions/${transactionToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...editFormData,
          amount,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      const updatedTransaction = await response.json();
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
      );
      setSuccess("Transaction updated successfully");
      setIsEditDialogOpen(false);
      setTransactionToEdit(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update transaction";
      setError(errorMessage);
    }
  };

  // Open edit dialog
  const openEditDialog = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setEditFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      status: transaction.status,
      date: new Date(transaction.date).toISOString().slice(0, 16),
    });
    setEditFormError(null);
    setIsEditDialogOpen(true);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
    setSortDirection("desc");
    setSortField("date");
  };

  // Export transactions (placeholder)
  const exportTransactions = () => {
    alert("In a production environment, this would download a CSV file of the transactions.");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-700" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <X className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-primary-900">User Not Found</h2>
          <p className="mt-2 text-primary-600">The requested user could not be found.</p>
          <Button asChild className="mt-6 bg-primary-600 hover:bg-primary-700 text-white">
            <Link href="/admin/users">Back to Users</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          asChild
          className="p-0 mb-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100 transition-colors"
        >
          <Link href={`/admin/users/${userId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Profile
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
              Transaction History for {user.fullName}
            </h1>
            <p className="text-primary-600">
              Account: {user.accountNumber} | Balance: ${user.balance.toFixed(2)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportTransactions}
            className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-700" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
            <X className="h-4 w-4 text-red-700" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6 backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary-900">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="search" className="mb-2 block text-primary-800">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary-500" />
                  <Input
                    id="search"
                    placeholder="Search transactions..."
                    className="pl-8 border-primary-200 focus:border-primary-400 bg-white/80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="type-filter" className="mb-2 block text-primary-800">
                  Type
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter" className="border-primary-200 bg-white/80">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="fee">Fee</SelectItem>
                    <SelectItem value="interest">Interest</SelectItem>
                    <SelectItem value="crypto_buy">Crypto Buy</SelectItem>
                    <SelectItem value="crypto_sell">Crypto Sell</SelectItem>
                    <SelectItem value="refund">Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter" className="mb-2 block text-primary-800">
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="border-primary-200 bg-white/80">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date-filter" className="mb-2 block text-primary-800">
                  Date Range
                </Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger id="date-filter" className="border-primary-200 bg-white/80">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                <X className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
              <div className="flex items-center gap-2">
                <Label htmlFor="sort-field" className="text-sm text-primary-800">
                  Sort by:
                </Label>
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger id="sort-field" className="w-[120px] border-primary-200 bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  className="text-primary-700 hover:bg-primary-100"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-primary-900">Transactions</CardTitle>
              <div className="text-sm text-primary-600">
                Showing {filteredTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentPageItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-primary-50/50">
                      <th className="text-left p-4 text-primary-800">Date</th>
                      <th className="text-left p-4 text-primary-800">Description</th>
                      <th className="text-left p-4 text-primary-800">Type</th>
                      <th className="text-right p-4 text-primary-800">Amount</th>
                      <th className="text-center p-4 text-primary-800">Status</th>
                      <th className="text-center p-4 text-primary-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {currentPageItems.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="p-4 text-sm text-primary-900">
                          {new Date(transaction.date).toLocaleString()}
                        </td>
                        <td className="p-4 text-sm text-primary-900">{transaction.description}</td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={
                              transaction.type === "deposit"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : transaction.type === "withdrawal"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : transaction.type === "transfer"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : transaction.type === "payment"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : transaction.type === "fee"
                                ? "bg-gray-50 text-gray-700 border-gray-200"
                                : transaction.type === "interest"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : transaction.type === "crypto_buy" || transaction.type === "crypto_sell"
                                ? "bg-secondary-50 text-secondary-700 border-secondary-200"
                                : transaction.type === "refund"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }
                          >
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-right text-sm text-primary-900">
                          ${transaction.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge
                            variant="outline"
                            className={
                              transaction.status === "completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : transaction.status === "pending"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(transaction)}
                            className="text-primary-700 hover:text-primary-900"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setTransactionToDelete(transaction.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-primary-600">
                No transactions found matching your filters.
              </div>
            )}

            {filteredTransactions.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-primary-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                    <SelectTrigger className="w-[100px] border-primary-200 bg-white/80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 per page</SelectItem>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="border-primary-200 text-primary-700 hover:bg-primary-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="border-primary-200 text-primary-700 hover:bg-primary-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] backdrop-blur-sm bg-white/60 border border-primary-100">
            <DialogHeader>
              <DialogTitle className="text-primary-900">Edit Transaction</DialogTitle>
              <DialogDescription className="text-primary-600">
                Modify the transaction details below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {editFormError && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <X className="h-4 w-4 text-red-700" />
                  <AlertDescription className="text-red-700">{editFormError}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-description" className="text-primary-800">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="border-primary-200 focus:border-primary-400 bg-white/80"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount" className="text-primary-800">
                    Amount
                  </Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                    className="border-primary-200 focus:border-primary-400 bg-white/80"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-date" className="text-primary-800">
                    Date
                  </Label>
                  <Input
                    id="edit-date"
                    type="datetime-local"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="border-primary-200 focus:border-primary-400 bg-white/80"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-type" className="text-primary-800">
                    Type
                  </Label>
                  <Select value={editFormData.type} onValueChange={(value) => setEditFormData({ ...editFormData, type: value })}>
                    <SelectTrigger id="edit-type" className="border-primary-200 bg-white/80">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                      <SelectItem value="interest">Interest</SelectItem>
                      <SelectItem value="crypto_buy">Crypto Buy</SelectItem>
                      <SelectItem value="crypto_sell">Crypto Sell</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-status" className="text-primary-800">
                    Status
                  </Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger id="edit-status" className="border-primary-200 bg-white/80">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditFormError(null);
                }}
                className="border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditTransaction}
                className="bg-primary-600 text-white hover:bg-primary-700"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="backdrop-blur-sm bg-white/60 border border-primary-100">
            <DialogHeader>
              <DialogTitle className="text-primary-900">Delete Transaction</DialogTitle>
              <DialogDescription className="text-primary-600">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setTransactionToDelete(null);
                }}
                className="border-primary-200 text-primary-700 hover:bg-primary-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTransaction}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}