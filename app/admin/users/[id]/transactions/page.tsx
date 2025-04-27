"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Color from "color";
import {
  ArrowLeft,
  ArrowUp,
  CreditCard,
  ArrowUpDown,
  FileText,
  RefreshCcw,
  Check,
  Send,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interface for Colors
interface Colors {
  primaryColor: string;
  secondaryColor: string;
}

// Interface for User
interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  accountNumber: string;
  balance: number;
}

// Interface for Transaction
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
  memo?: string;
  transferId?: string;
}

// Interface for Transaction Group
interface TransactionGroup {
  id: string;
  userIds: string[];
  description: string;
  date: string;
  amount: number;
  status: string;
  accounts: string[];
  transactionIds: string[];
  type: string;
}

export default function UserTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // State
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<
    TransactionGroup[]
  >([]);
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
          document.documentElement.style.setProperty(
            `--primary-${shade}`,
            color
          );
        });
        Object.entries(secondaryShades).forEach(([shade, color]) => {
          document.documentElement.style.setProperty(
            `--secondary-${shade}`,
            color
          );
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
          fetch(`/api/admin/transactions`, { credentials: "include" }),
        ]);

        let userData = null;
        if (userRes.ok) {
          const data = await userRes.json();
          userData = data.user;
        } else {
          throw new Error("Failed to fetch user data");
        }

        if (!transactionsRes.ok) {
          const errorText = await transactionsRes.text();
          if (transactionsRes.status === 401) {
            setError("Unauthorized: Please log in again");
            router.push("/admin/login");
            return;
          } else if (transactionsRes.status === 403) {
            setError("Forbidden: Admin access required");
            return;
          }
          throw new Error(`Failed to fetch transactions: ${errorText}`);
        }

        const transactionsData = await transactionsRes.json();
        const validTransactions = transactionsData.transactions.filter(
          (tx: Transaction) =>
            typeof tx.amount === "number" && !isNaN(tx.amount) && tx.userId
        );

        setTransactions(validTransactions);
        setUser(userData);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load user data and transactions";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, router]);

  // Group and filter transactions
  useEffect(() => {
    if (!user || !transactions.length) return;

    const userMap = new Map([
      [user.id, { name: user.fullName, email: user.email }],
    ]);

    const transferGroups = new Map<string, Transaction[]>();
    const remainingTransactions: Transaction[] = [];

    transactions.forEach((tx) => {
      if (tx.transferId) {
        const key = tx.transferId;
        if (!transferGroups.has(key)) transferGroups.set(key, []);
        transferGroups.get(key)!.push(tx);
      } else {
        remainingTransactions.push(tx);
      }
    });

    const grouped: TransactionGroup[] = [];

    transferGroups.forEach((txs, transferId) => {
      const userIds = [...new Set(txs.map((tx) => tx.userId))];
      const date = txs[0].date;
      const status = txs.every((tx) => tx.status === "completed")
        ? "completed"
        : "pending";
      const accounts = [...new Set(txs.map((tx) => tx.account))];
      const transactionIds = txs.map((tx) => tx.id);

      if (txs.length === 2) {
        const senderTx = txs.find((tx) => tx.amount < 0);
        const receiverTx = txs.find((tx) => tx.amount > 0);
        if (senderTx && receiverTx) {
          const sender = userMap.get(senderTx.userId) || {
            name: senderTx.userName,
            email: senderTx.userEmail,
          };
          const receiver = userMap.get(receiverTx.userId) || {
            name: receiverTx.userName,
            email: receiverTx.userEmail,
          };
          grouped.push({
            id: transferId,
            userIds,
            description: `Zelle transfer from ${sender.name || "Unknown"} to ${
              receiver.name || "Unknown"
            }`,
            date,
            amount: Math.abs(senderTx.amount),
            status,
            accounts,
            transactionIds,
            type: "transfer",
          });
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
          });
        });
      }
    });

    const txByDate = new Map<string, Transaction[]>();
    remainingTransactions.forEach((tx) => {
      const key = tx.date;
      if (!txByDate.has(key)) txByDate.set(key, []);
      txByDate.get(key)!.push(tx);
    });

    txByDate.forEach((txs, date) => {
      const unpaired: Transaction[] = [...txs];
      while (unpaired.length >= 2) {
        let paired = false;
        for (let i = 0; i < unpaired.length - 1; i++) {
          for (let j = i + 1; j < unpaired.length; j++) {
            const tx1 = unpaired[i];
            const tx2 = unpaired[j];
            if (
              tx1.amount === -tx2.amount &&
              (tx1.type === "deposit" || tx1.type === "transfer") &&
              (tx2.type === "deposit" || tx2.type === "transfer")
            ) {
              const senderTx = tx1.amount < 0 ? tx1 : tx2;
              const receiverTx = tx1.amount < 0 ? tx2 : tx1;
              const sender = userMap.get(senderTx.userId) || {
                name: senderTx.userName,
                email: senderTx.userEmail,
              };
              const receiver = userMap.get(receiverTx.userId) || {
                name: receiverTx.userName,
                email: receiverTx.userEmail,
              };
              grouped.push({
                id: `${senderTx.id}-${receiverTx.id}`,
                userIds: [senderTx.userId, receiverTx.userId],
                description: `Zelle transfer from ${
                  sender.name || "Unknown"
                } to ${receiver.name || "Unknown"}`,
                date,
                amount: Math.abs(senderTx.amount),
                status:
                  senderTx.status === "completed" &&
                  receiverTx.status === "completed"
                    ? "completed"
                    : "pending",
                accounts: [senderTx.account, receiverTx.account],
                transactionIds: [senderTx.id, receiverTx.id],
                type: "transfer",
              });
              unpaired.splice(j, 1);
              unpaired.splice(i, 1);
              paired = true;
              break;
            }
          }
          if (paired) break;
        }
        if (!paired) break;
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
        });
      });
    });

    // Filter transactions where the user's fullName matches sender or receiver
    const filtered = grouped.filter((group) =>
      group.description
        .toLowerCase()
        .includes(user.fullName.toLowerCase())
    );

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setGroupedTransactions(filtered);
  }, [transactions, user]);

  // Compute filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    let result = [...groupedTransactions];

    if (debouncedSearchTerm) {
      result = result.filter(
        (group) =>
          group.description
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          group.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((group) => group.type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((group) => group.status === statusFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (dateFilter === "today") {
        result = result.filter((group) => new Date(group.date) >= today);
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        result = result.filter((group) => new Date(group.date) >= weekAgo);
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        result = result.filter((group) => new Date(group.date) >= monthAgo);
      }
    }

    result.sort((a, b) => {
      if (sortField === "date") {
        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortField === "amount") {
        return sortDirection === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
      return 0;
    });

    return result;
  }, [
    groupedTransactions,
    debouncedSearchTerm,
    typeFilter,
    statusFilter,
    dateFilter,
    sortField,
    sortDirection,
  ]);

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
    alert(
      "In a production environment, this would download a CSV file of the transactions."
    );
  };

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
      case "interest":
        return <ArrowUpDown className="h-5 w-5 text-green-600" />;
      case "withdrawal":
        return <ArrowUp className="h-5 w-5 text-red-600" />;
      case "transfer":
        return <Send className="h-5 w-5 text-primary-600" />;
      case "payment":
        return <CreditCard className="h-5 w-5 text-orange-600" />;
      case "fee":
        return <FileText className="h-5 w-5 text-gray-600" />;
      case "refund":
        return <RefreshCcw className="h-5 w-5 text-yellow-600" />;
      case "crypto_buy":
      case "crypto_sell":
        return <CreditCard className="h-5 w-5 text-purple-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
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
          <h2 className="mt-4 text-2xl font-bold text-primary-900">
            User Not Found
          </h2>
          <p className="mt-2 text-primary-600">
            The requested user could not be found.
          </p>
          <Button
            asChild
            className="mt-6 bg-primary-600 hover:bg-primary-700 text-white"
          >
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
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50 border-red-200"
          >
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
                <Label
                  htmlFor="type-filter"
                  className="mb-2 block text-primary-800"
                >
                  Type
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger
                    id="type-filter"
                    className="border-primary-200 bg-white/80"
                  >
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
                <Label
                  htmlFor="status-filter"
                  className="mb-2 block text-primary-800"
                >
                  Status
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger
                    id="status-filter"
                    className="border-primary-200 bg-white/80"
                  >
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
                <Label
                  htmlFor="date-filter"
                  className="mb-2 block text-primary-800"
                >
                  Date Range
                </Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger
                    id="date-filter"
                    className="border-primary-200 bg-white/80"
                  >
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
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
                <Label
                  htmlFor="sort-field"
                  className="text-sm text-primary-800"
                >
                  Sort by:
                </Label>
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger
                    id="sort-field"
                    className="w-[120px] border-primary-200 bg-white/80"
                  >
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
                  onClick={() =>
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                  }
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
                Showing{" "}
                {filteredTransactions.length > 0
                  ? (currentPage - 1) * itemsPerPage + 1
                  : 0}
                -
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredTransactions.length
                )}{" "}
                of {filteredTransactions.length}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentPageItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-primary-50/50">
                      <th className="text-left p-4 text-primary-800">ID</th>
                      <th className="text-left p-4 text-primary-800">Users</th>
                      <th className="text-left p-4 text-primary-800">
                        Description
                      </th>
                      <th className="text-left p-4 text-primary-800">Date</th>
                      <th className="text-left p-4 text-primary-800">
                        Accounts
                      </th>
                      <th className="text-right p-4 text-primary-800">Amount</th>
                      <th className="text-center p-4 text-primary-800">Status</th>
                      <th className="text-center p-4 text-primary-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {currentPageItems.map((group) => {
                      const userNames = group.userIds.map(
                        (id) =>
                          transactions.find((tx) => tx.userId === id)?.userName ||
                          "Unknown User"
                      );
                      const isGroup = group.transactionIds.length > 1;
                      const senderTxId = group.transactionIds.find((txId) => {
                        const tx = transactions.find((t) => t.id === txId);
                        return tx?.amount !== undefined && tx.amount < 0;
                      });
                      const receiverTxId = group.transactionIds.find((txId) => {
                        const tx = transactions.find((t) => t.id === txId);
                        return tx && tx.amount !== undefined && tx.amount > 0;
                      });
                      const detailLink = isGroup
                        ? `/admin/transactions/${senderTxId}?receiverId=${receiverTxId}`
                        : `/admin/transactions/${group.transactionIds[0]}`;

                      return (
                        <tr
                          key={group.id}
                          className="hover:bg-primary-50/50 transition-colors"
                        >
                          <td className="p-4 font-mono text-xs">
                            {isGroup ? `Group: ${group.id}` : group.id}
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-primary-900">
                                {userNames.join(" to ")}
                              </div>
                              <div className="text-sm text-primary-600">
                                {userNames.map((name, index) => (
                                  <span key={group.userIds[index]}>
                                    {
                                      transactions.find(
                                        (tx) => tx.userId === group.userIds[index]
                                      )?.userEmail
                                    }
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
                                <div className="font-medium">
                                  {group.description}
                                </div>
                                <div className="text-sm text-muted-foreground capitalize">
                                  {group.type.replace("_", " ")}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {new Date(group.date).toLocaleString()}
                          </td>
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
                              {group.status.charAt(0).toUpperCase() +
                                group.status.slice(1)}
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
                                <DropdownMenuLabel>
                                  Transaction Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link href={detailLink}>
                                    View Transaction
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
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
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => setItemsPerPage(Number(value))}
                  >
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
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
      </div>
    </div>
  );
}