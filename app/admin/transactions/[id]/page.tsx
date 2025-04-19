"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  CreditCard,
  Edit,
  FileText,
  Loader2,
  RefreshCcw,
  Save,
  Send,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type:
    | "deposit"
    | "withdrawal"
    | "transfer"
    | "payment"
    | "fee"
    | "interest"
    | "crypto_buy"
    | "crypto_sell"
    | "refund";
  amount: number;
  description: string;
  date: string;
  status: "completed" | "pending" | "failed";
  account: string;
  memo?: string;
  relatedTransactionId?: string;
  cryptoAmount?: number;
  cryptoPrice?: number;
}

interface UserType {
  id: string;
  fullName: string;
  email: string;
  accountNumber: string;
  balance: number;
  cryptoBalance: number;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  // States
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [refundedTransactions, setRefundedTransactions] = useState<Transaction[]>([]);
  const [relatedTransfer, setRelatedTransfer] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRefund, setConfirmRefund] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    description: "",
    amount: 0,
    type: "",
    status: "",
    memo: "",
    cryptoAmount: 0,
    cryptoPrice: 0,
  });

  // Fetch transaction and related data
  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        setLoading(true);

        // Fetch transaction
        const transactionRes = await fetch(`/api/admin/transactions/${transactionId}`, {
          credentials: "include",
        });
        if (!transactionRes.ok) {
          throw new Error(`Failed to fetch transaction: ${transactionRes.statusText}`);
        }
        const responseData = await transactionRes.json();
        const { transaction } = responseData;

        if (!transaction) {
          throw new Error("No transaction data returned from API");
        }

        setTransaction(transaction);

        // Initialize edit form
        setEditForm({
          description: transaction.description || "",
          amount: transaction.amount || 0,
          type: transaction.type || "",
          status: transaction.status || "",
          memo: transaction.memo || "",
          cryptoAmount: transaction.cryptoAmount || 0,
          cryptoPrice: transaction.cryptoPrice || 0,
        });

        // Fetch user data
        const userRes = await fetch(`/api/admin/users/${transaction.userId}`, {
          credentials: "include",
        });
        let userData = null;
        if (userRes.ok) {
          userData = (await userRes.json()).user;
        } else {
          console.warn("User fetch failed, using fallback data");
          userData = {
            id: transaction.userId,
            fullName: transaction.userName || "Unknown",
            email: transaction.userEmail || "Unknown",
            accountNumber: "Unknown",
            balance: 0,
            cryptoBalance: 0,
          };
        }
        setUser(userData);

        // Fetch all user transactions to check for refunds and related transfers
        const transactionsRes = await fetch(`/api/admin/users/${transaction.userId}/transactions`, {
          credentials: "include",
        });
        if (!transactionsRes.ok) {
          throw new Error(`Failed to fetch user transactions: ${transactionsRes.statusText}`);
        }
        const { transactions } = await transactionsRes.json();
        const refunds = transactions.filter((tx: Transaction) => tx.relatedTransactionId === transactionId);
        setRefundedTransactions(refunds);

        // Check for related transfer (checking-to-savings or savings-to-checking)
        if (transaction.type === "transfer") {
          const pairedTx = transactions.find(
            (tx: Transaction) =>
              tx.type === "transfer" &&
              tx.userId === transaction.userId &&
              Math.abs(tx.amount) === Math.abs(transaction.amount) &&
              tx.amount === -transaction.amount &&
              new Date(tx.date).getTime() === new Date(transaction.date).getTime() &&
              tx.account !== transaction.account
          );
          setRelatedTransfer(pairedTx || null);
        }
      } catch (error: any) {
        setError(error.message || "Failed to load transaction data");
        console.error("Error in fetchTransactionData:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionData();
  }, [transactionId]);

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
      case "interest":
        return <ArrowDown className="h-5 w-5 text-green-600" />;
      case "withdrawal":
        return <ArrowUp className="h-5 w-5 text-red-600" />;
      case "transfer":
        return <Send className="h-5 w-5 text-blue-600" />;
      case "payment":
        return <CreditCard className="h-5 w-5 text-orange-600" />;
      case "fee":
        return <FileText className="h-5 w-5 text-gray-600" />;
      case "refund":
        return <RefreshCcw className="h-5 w-5 text-yellow-600" />;
      case "crypto_buy":
        return <CreditCard className="h-5 w-5 text-purple-600" />;
      case "crypto_sell":
        return <CreditCard className="h-5 w-5 text-indigo-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!transaction) return;

    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/transactions/${transactionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update transaction");
      }

      const { transaction: updatedTransaction, userBalance, userCryptoBalance } = await response.json();
      setTransaction(updatedTransaction);
      if (user) {
        setUser({ ...user, balance: userBalance, cryptoBalance: userCryptoBalance || user.cryptoBalance });
      }
      setSuccess("Transaction updated successfully");
      setEditMode(false);
    } catch (error: any) {
      setError(error.message || "Failed to update transaction");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Handle refund transaction
  const handleRefundTransaction = async () => {
    if (!transaction || !user) return;

    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/transactions/${transactionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ relatedTransferId: relatedTransfer?.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process refund");
      }

      const { transaction: refundTransaction, userBalance, userCryptoBalance, relatedRefund } = await response.json();
      setRefundedTransactions([refundTransaction, ...refundedTransactions]);
      setUser({ ...user, balance: userBalance, cryptoBalance: userCryptoBalance || user.cryptoBalance });
      if (relatedRefund) {
        setRefundedTransactions((prev) => [relatedRefund, ...prev]);
      }
      setSuccess("Refund processed successfully");
    } catch (error: any) {
      setError(error.message || "Failed to process refund");
      console.error(error);
    } finally {
      setSaving(false);
      setConfirmRefund(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-700" />
      </div>
    );
  }

  // Error state
  if (!transaction || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <X className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-indigo-900">Transaction Not Found</h2>
          <p className="mt-2 text-indigo-600">The requested transaction could not be found.</p>
          <Button asChild className="mt-6 bg-indigo-600 hover:bg-indigo-700">
            <Link href="/admin/transactions">Back to Transactions</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="p-0 mb-2 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 transition-colors"
          >
            <Link href="/admin/transactions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transactions
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                Transaction Details
              </h1>
              <p className="text-indigo-600">
                Transaction ID: <span className="font-mono">{transaction.id}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {!editMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(true)}
                    className="bg-white/60 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-300"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Transaction
                  </Button>
                  {transaction.type !== "refund" && (
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmRefund(true)}
                      disabled={refundedTransactions.length > 0}
                      className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-800 disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      Refund
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSaveChanges} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Success/Error Alerts */}
        {success && (
          <Alert className="mb-6 bg-green-50 border border-green-200 text-green-800">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border border-red-200">
            <X className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Transaction Details */}
          <div className="md:col-span-2 space-y-6">
            <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-indigo-900">Transaction Information</CardTitle>
                <CardDescription className="text-indigo-600">Details about this transaction</CardDescription>
              </CardHeader>
              <CardContent>
                {!editMode ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center bg-indigo-100">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-indigo-900">{transaction.description}</h3>
                        <p className="text-sm text-indigo-600 capitalize">{transaction.type.replace("_", " ")}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-indigo-600 mb-1">Amount</h4>
                        <p
                          className={`text-2xl font-bold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {transaction.amount > 0 ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-indigo-600 mb-1">Status</h4>
                        <Badge
                          className="text-base px-3 py-1"
                          variant={
                            transaction.status === "completed"
                              ? "default"
                              : transaction.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium text-indigo-600 mb-1">Date & Time</h4>
                        <p className="text-indigo-900">{new Date(transaction.date).toLocaleString()}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-indigo-600 mb-1">Account</h4>
                        <p className="text-indigo-900">{transaction.account}</p>
                      </div>
                    </div>

                    {(transaction.memo || transaction.cryptoAmount || transaction.cryptoPrice) && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          {transaction.memo && (
                            <div>
                              <h4 className="text-sm font-medium text-indigo-600 mb-1">Memo</h4>
                              <p className="text-indigo-900">{transaction.memo}</p>
                            </div>
                          )}
                          {(transaction.cryptoAmount || transaction.cryptoPrice) && (
                            <div>
                              <h4 className="text-sm font-medium text-indigo-600 mb-1">Crypto Details</h4>
                              <p className="text-indigo-900">
                                {transaction.cryptoAmount
                                  ? `Amount: ${transaction.cryptoAmount} BTC`
                                  : "Amount: N/A"}
                              </p>
                              <p className="text-indigo-900">
                                {transaction.cryptoPrice
                                  ? `Price: $${transaction.cryptoPrice.toFixed(2)}`
                                  : "Price: N/A"}
                              </p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-indigo-800">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-indigo-800">
                          Amount
                        </Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">$</div>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            className="pl-7 border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({ ...editForm, amount: Number.parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-indigo-800">
                          Status
                        </Label>
                        <Select
                          value={editForm.status}
                          onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                        >
                          <SelectTrigger id="status" className="border-indigo-200 bg-white/80">
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

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-indigo-800">
                        Transaction Type
                      </Label>
                      <Select
                        value={editForm.type}
                        onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                      >
                        <SelectTrigger id="type" className="border-indigo-200 bg-white/80">
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

                    {(editForm.type === "crypto_buy" || editForm.type === "crypto_sell") && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="cryptoAmount" className="text-indigo-800">
                            Crypto Amount (BTC)
                          </Label>
                          <Input
                            id="cryptoAmount"
                            type="number"
                            step="0.00000001"
                            value={editForm.cryptoAmount}
                            onChange={(e) =>
                              setEditForm({ ...editForm, cryptoAmount: Number.parseFloat(e.target.value) })
                            }
                            className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cryptoPrice" className="text-indigo-800">
                            Crypto Price ($)
                          </Label>
                          <Input
                            id="cryptoPrice"
                            type="number"
                            step="0.01"
                            value={editForm.cryptoPrice}
                            onChange={(e) =>
                              setEditForm({ ...editForm, cryptoPrice: Number.parseFloat(e.target.value) })
                            }
                            className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="memo" className="text-indigo-800">
                        Memo / Description
                      </Label>
                      <Textarea
                        id="memo"
                        value={editForm.memo}
                        onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                        placeholder="Optional memo or description"
                        className="border-indigo-200 bg-white/80 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {refundedTransactions.length > 0 && (
              <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-indigo-900">Refund History</CardTitle>
                  <CardDescription className="text-indigo-600">Related refund transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {refundedTransactions.map((refund) => (
                      <div
                        key={refund.id}
                        className="flex items-center gap-4 border-b pb-4 last:border-b-0"
                      >
                        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-indigo-100">
                          {getTransactionIcon(refund.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-indigo-900">{refund.description}</p>
                          <p className="text-sm text-indigo-600">{new Date(refund.date).toLocaleString()}</p>
                        </div>
                        <p
                          className={`font-bold ${refund.amount > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {refund.amount > 0 ? "+" : ""}${Math.abs(refund.amount).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* User Information Sidebar */}
          <div className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-indigo-900">User Information</CardTitle>
                <CardDescription className="text-indigo-600">Account owner details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 border-4 border-indigo-100">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      {user.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-indigo-900">{user.fullName}</h3>
                    <p className="text-sm text-indigo-600">{user.email}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-indigo-600">Account Number</p>
                    <p className="font-medium font-mono text-indigo-900">{user.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600">Current Balance</p>
                    <p className="text-xl font-bold text-indigo-900">${user.balance.toFixed(2)}</p>
                  </div>
                  {(transaction.type === "crypto_buy" || transaction.type === "crypto_sell") && (
                    <div>
                      <p className="text-sm text-indigo-600">Crypto Balance</p>
                      <p className="text-xl font-bold text-indigo-900">{user.cryptoBalance.toFixed(8)} BTC</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  asChild
                >
                  <Link href={`/admin/users/${user.id}`}>
                    <User className="mr-2 h-4 w-4" />
                    View User Profile
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Refund Confirmation Dialog */}
        <Dialog open={confirmRefund} onOpenChange={setConfirmRefund}>
          <DialogContent className="bg-white/95 backdrop-blur-sm border border-indigo-100">
            <DialogHeader>
              <DialogTitle className="text-indigo-900">Refund Transaction</DialogTitle>
              <DialogDescription className="text-indigo-600">
                Are you sure you want to refund this transaction? This will reverse the payment and create a new refund
                transaction record.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-medium mb-2 text-yellow-800">Impact of Refund</h3>
              <p className="text-sm text-yellow-700 mb-2">Refunding this transaction will:</p>
              <ul className="text-sm text-yellow-700 list-disc pl-5 space-y-1">
                <li>Create a new refund transaction record</li>
                {transaction.type === "crypto_buy" ? (
                  <>
                    <li>Add ${Math.abs(transaction.amount).toFixed(2)} to the {transaction.account} account</li>
                    <li>Deduct {transaction.cryptoAmount} BTC from the crypto balance</li>
                  </>
                ) : transaction.type === "crypto_sell" ? (
                  <>
                    <li>Deduct ${Math.abs(transaction.amount).toFixed(2)} from the {transaction.account} account</li>
                    <li>Add {transaction.cryptoAmount} BTC to the crypto balance</li>
                  </>
                ) : (
                  <li>
                    {transaction.amount > 0
                      ? `Return $${transaction.amount.toFixed(2)} to the ${transaction.account} account`
                      : `Deduct $${Math.abs(transaction.amount).toFixed(2)} from the ${transaction.account} account`}
                  </li>
                )}
                {relatedTransfer && (
                  <li>
                    Reverse the paired transfer of ${Math.abs(relatedTransfer.amount).toFixed(2)} to the{" "}
                    {relatedTransfer.account} account
                  </li>
                )}
                <li>Update the account balance accordingly</li>
              </ul>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmRefund(false)}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleRefundTransaction}
                disabled={saving}
                className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-800"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Refund...
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Process Refund
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}