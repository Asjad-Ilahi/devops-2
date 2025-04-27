"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Color from "color"
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
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"




interface Colors {
  primaryColor: string
  secondaryColor: string
}

interface EditForm {
  description: string
  amount: number
  type: Transaction["type"]
  category: string
  status: Transaction["status"]
  memo: string
  cryptoAmount: number
  cryptoPrice: number
}

interface Transaction {
  id: string
  userId: string
  userName: string
  userEmail: string
  type:
    | "deposit"
    | "withdrawal"
    | "transfer"
    | "payment"
    | "fee"
    | "interest"
    | "crypto_buy"
    | "crypto_sell"
    | "refund"
  amount: number
  description: string
  date: string
  status: "completed" | "pending" | "failed"
  category: string
  accountType: "checking" | "savings" | "crypto"
  memo?: string
  relatedTransactionId?: string
  cryptoAmount?: number
  cryptoPrice?: number
  transferId?: string
}

interface UserType {
  id: string
  fullName: string
  email: string
  accountNumber: string
  balance: number
  savingsBalance?: number
  cryptoBalance: number
}

export default function TransactionDetailPage() {

  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = params.id as string
  const receiverId = searchParams.get("receiverId") || null
  const [senderTransaction, setSenderTransaction] = useState<Transaction | null>(null)
  const [receiverTransaction, setReceiverTransaction] = useState<Transaction | null>(null)
  const [senderUser, setSenderUser] = useState<UserType | null>(null)
  const [receiverUser, setReceiverUser] = useState<UserType | null>(null)
  const [refundedTransactions, setRefundedTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState<{ sender: boolean; receiver: boolean }>({ sender: false, receiver: false })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmRefund, setConfirmRefund] = useState(false)
  const [colors, setColors] = useState<Colors | null>(null)
  const from = searchParams.get("from")
  const backLink = from === "dashboard" ? "/admin/dashboard" : "/admin/transactions"
  const [editFormSender, setEditFormSender] = useState<EditForm>({
    description: "",
    amount: 0,
    type: "deposit",
    category: "",
    status: "completed",
    memo: "",
    cryptoAmount: 0,
    cryptoPrice: 0,
  })
  const [editFormReceiver, setEditFormReceiver] = useState<EditForm>({
    description: "",
    amount: 0,
    type: "deposit",
    category: "",
    status: "completed",
    memo: "",
    cryptoAmount: 0,
    cryptoPrice: 0,
  })

  useEffect(() => {
    const fetchColors = async () => {
      console.log("DEBUG: Fetching colors...")
      try {
        const response = await fetch("/api/colors")
        console.log("DEBUG: Colors API response status:", response.status)
        if (!response.ok) throw new Error("Failed to fetch colors")
        const data: Colors = await response.json()
        console.log("DEBUG: Colors fetched:", data)
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
        console.log("DEBUG: Color shades applied")
      } catch (error) {
        console.error("DEBUG: Error fetching colors:", error)
      }
    }
    fetchColors()
  }, [])

  useEffect(() => {
    const fetchTransactionData = async () => {
      console.log("DEBUG: Starting fetchTransactionData...")
      console.log("DEBUG: Transaction ID:", transactionId)
      console.log("DEBUG: Receiver ID:", receiverId)

      try {
        setLoading(true)
        // Fetch sender transaction
        console.log("DEBUG: Fetching sender transaction...")
        const senderTxRes = await fetch(`/api/admin/transactions/${transactionId}`, {
          method: "GET",
          credentials: "include",
        })
        console.log("DEBUG: Sender transaction response status:", senderTxRes.status)
        if (!senderTxRes.ok) {
          if (senderTxRes.status === 401) {
            console.log("DEBUG: Unauthorized, redirecting to login")
            router.push("/admin/login")
            return
          }
          const errorText = await senderTxRes.text()
          console.log("DEBUG: Sender transaction error response:", errorText)
          throw new Error(`Failed to fetch sender transaction: ${senderTxRes.statusText}`)
        }
        const senderData = await senderTxRes.json()
        console.log("DEBUG: Sender transaction data:", senderData)
        const senderTx = senderData.transaction
        if (!senderTx) {
          console.log("DEBUG: No sender transaction data returned")
          throw new Error("No sender transaction data returned from API")
        }
        setSenderTransaction(senderTx)
        setEditFormSender({
          description: senderTx.description || "",
          amount: senderTx.amount || 0,
          type: senderTx.type || "deposit",
          category: senderTx.category || "",
          status: senderTx.status || "completed",
          memo: senderTx.memo || "",
          cryptoAmount: senderTx.cryptoAmount || 0,
          cryptoPrice: senderTx.cryptoPrice || 0,
        })
        console.log("DEBUG: Set sender transaction and edit form")

        // Fetch sender user
        console.log("DEBUG: Fetching sender user...")
        const senderUserRes = await fetch(`/api/admin/users/${senderTx.userId}`, {
          credentials: "include",
        })
        console.log("DEBUG: Sender user response status:", senderUserRes.status)
        let senderUserData: UserType = {
          id: senderTx.userId,
          fullName: senderTx.userName || "Unknown",
          email: senderTx.userEmail || "Unknown",
          accountNumber: "Unknown",
          balance: 0,
          savingsBalance: 0,
          cryptoBalance: 0,
        }
        if (senderUserRes.ok) {
          const data = await senderUserRes.json()
          console.log("DEBUG: Sender user data:", data)
          senderUserData = data.user
        } else {
          console.log("DEBUG: Failed to fetch sender user, using fallback data")
        }
        setSenderUser(senderUserData)
        console.log("DEBUG: Set sender user")

        // Fetch sender refunds
        console.log("DEBUG: Fetching sender refunds...")
        const senderRefundsRes = await fetch(`/api/admin/transactions?relatedTransactionId=${senderTx.id}`, {
          credentials: "include",
        })
        console.log("DEBUG: Sender refunds response status:", senderRefundsRes.status)
        if (senderRefundsRes.ok) {
          const { transactions: senderRefunds } = await senderRefundsRes.json()
          console.log("DEBUG: Sender refunds:", senderRefunds)
          setRefundedTransactions((prev) => {
            const existingIds = new Set(prev.map((tx) => tx.id))
            const newRefunds = senderRefunds.filter((tx: Transaction) => !existingIds.has(tx.id))
            return [...prev, ...newRefunds]
          })
        } else {
          console.log("DEBUG: Failed to fetch sender refunds")
        }

        // Check if this is an internal transfer, Zelle transfer, or External transfer
        if ((senderTx.category === "Transfer" || senderTx.category === "Zelle") && senderTx.transferId && !receiverId) {
          console.log("DEBUG: Detected internal or Zelle transfer, fetching corresponding receiver transaction...")
          const relatedTxRes = await fetch(`/api/admin/transactions?transferId=${senderTx.transferId}`, {
            credentials: "include",
          })
          console.log("DEBUG: Related transactions response status:", relatedTxRes.status)
          if (relatedTxRes.ok) {
            const { transactions: relatedTransactions } = await relatedTxRes.json()
            console.log("DEBUG: Related transactions:", relatedTransactions)
            const receiverTx = relatedTransactions.find(
              (tx: Transaction) => tx.id !== senderTx.id && tx.amount > 0
            )
            if (receiverTx) {
              console.log("DEBUG: Receiver transaction found:", receiverTx)
              setReceiverTransaction(receiverTx)
              setEditFormReceiver({
                description: receiverTx.description || "",
                amount: receiverTx.amount || 0,
                type: receiverTx.type || "deposit",
                category: receiverTx.category || "",
                status: receiverTx.status || "completed",
                memo: receiverTx.memo || "",
                cryptoAmount: receiverTx.cryptoAmount || 0,
                cryptoPrice: receiverTx.cryptoPrice || 0,
              })

              // Fetch receiver user
              console.log("DEBUG: Fetching receiver user...")
              const receiverUserRes = await fetch(`/api/admin/users/${receiverTx.userId}`, {
                credentials: "include",
              })
              console.log("DEBUG: Receiver user response status:", receiverUserRes.status)
              let receiverUserData: UserType = {
                id: receiverTx.userId,
                fullName: receiverTx.userName || "Unknown",
                email: receiverTx.userEmail || "Unknown",
                accountNumber: "Unknown",
                balance: 0,
                savingsBalance: 0,
                cryptoBalance: 0,
              }
              if (receiverUserRes.ok) {
                const data = await receiverUserRes.json()
                console.log("DEBUG: Receiver user data:", data)
                receiverUserData = data.user
              } else {
                console.log("DEBUG: Failed to fetch receiver user, using fallback data")
              }
              setReceiverUser(receiverUserData)
              console.log("DEBUG: Set receiver user")

              // Fetch receiver refunds
              console.log("DEBUG: Fetching receiver refunds...")
              const receiverRefundsRes = await fetch(`/api/admin/transactions?relatedTransactionId=${receiverTx.id}`, {
                credentials: "include",
              })
              console.log("DEBUG: Receiver refunds response status:", receiverRefundsRes.status)
              if (receiverRefundsRes.ok) {
                const { transactions: receiverRefunds } = await receiverRefundsRes.json()
                console.log("DEBUG: Receiver refunds:", receiverRefunds)
                setRefundedTransactions((prev) => {
                  const existingIds = new Set(prev.map((tx) => tx.id))
                  const newRefunds = receiverRefunds.filter((tx: Transaction) => !existingIds.has(tx.id))
                  return [...prev, ...newRefunds]
                })
              } else {
                console.log("DEBUG: Failed to fetch receiver refunds")
              }
            } else {
              console.log("DEBUG: No receiver transaction found for transfer")
            }
          } else {
            console.log("DEBUG: Failed to fetch related transactions for transfer")
          }
        }

        // Fetch receiver transaction if receiverId exists
        if (receiverId) {
          console.log("DEBUG: Fetching receiver transaction...")
          const receiverTxRes = await fetch(`/api/admin/transactions/${receiverId}`, {
            method: "GET",
            credentials: "include",
          })
          console.log("DEBUG: Receiver transaction response status:", receiverTxRes.status)
          if (!receiverTxRes.ok) {
            if (receiverTxRes.status === 401) {
              console.log("DEBUG: Unauthorized, redirecting to login")
              router.push("/admin/login")
              return
            }
            const errorText = await receiverTxRes.text()
            console.log("DEBUG: Receiver transaction error response:", errorText)
            throw new Error(`Failed to fetch receiver transaction: ${receiverTxRes.statusText}`)
          }
          const receiverData = await receiverTxRes.json()
          console.log("DEBUG: Receiver transaction data:", receiverData)
          const receiverTx = receiverData.transaction
          if (!receiverTx) {
            console.log("DEBUG: No receiver transaction data returned")
            throw new Error("No receiver transaction data returned from API")
          }
          setReceiverTransaction(receiverTx)
          setEditFormReceiver({
            description: receiverTx.description || "",
            amount: receiverTx.amount || 0,
            type: receiverTx.type || "deposit",
            category: receiverTx.category || "",
            status: receiverTx.status || "completed",
            memo: receiverTx.memo || "",
            cryptoAmount: receiverTx.cryptoAmount || 0,
            cryptoPrice: receiverTx.cryptoPrice || 0,
          })
          console.log("DEBUG: Set receiver transaction and edit form")

          // Fetch receiver user
          console.log("DEBUG: Fetching receiver user...")
          const receiverUserRes = await fetch(`/api/admin/users/${receiverTx.userId}`, {
            credentials: "include",
          })
          console.log("DEBUG: Receiver user response status:", receiverUserRes.status)
          let receiverUserData: UserType = {
            id: receiverTx.userId,
            fullName: receiverTx.userName || "Unknown",
            email: receiverTx.userEmail || "Unknown",
            accountNumber: "Unknown",
            balance: 0,
            savingsBalance: 0,
            cryptoBalance: 0,
          }
          if (receiverUserRes.ok) {
            const data = await receiverUserRes.json()
            console.log("DEBUG: Receiver user data:", data)
            receiverUserData = data.user
          } else {
            console.log("DEBUG: Failed to fetch receiver user, using fallback data")
          }
          setReceiverUser(receiverUserData)
          console.log("DEBUG: Set receiver user")

          // Fetch receiver refunds
          console.log("DEBUG: Fetching receiver refunds...")
          const receiverRefundsRes = await fetch(`/api/admin/transactions?relatedTransactionId=${receiverTx.id}`, {
            credentials: "include",
          })
          console.log("DEBUG: Receiver refunds response status:", receiverRefundsRes.status)
          if (receiverRefundsRes.ok) {
            const { transactions: receiverRefunds } = await receiverRefundsRes.json()
            console.log("DEBUG: Receiver refunds:", receiverRefunds)
            setRefundedTransactions((prev) => {
              const existingIds = new Set();
              const newRefunds = receiverRefunds.filter((tx: Transaction) => !existingIds.has(tx.id));
              return [...prev, ...newRefunds]
            })
          } else {
            console.log("DEBUG: Failed to fetch receiver refunds")
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load transaction data"
        console.error("DEBUG: Error in fetchTransactionData:", errorMessage)
        setError(errorMessage)
      } finally {
        setLoading(false)
        console.log("DEBUG: fetchTransactionData completed")
      }
    }
    fetchTransactionData()
  }, [transactionId, receiverId, router])

  const getTransactionIcon = (type: string) => {
    console.log("DEBUG: Getting transaction icon for type:", type)
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
        return <CreditCard className="h-5 w-5 text-secondary-600" />
      case "crypto_sell":
        return <CreditCard className="h-5 w-5 text-primary-600" />
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }
  }

  const handleSaveChanges = async (type: "sender" | "receiver") => {
    console.log(`DEBUG: Starting handleSaveChanges for ${type}...`)
    const transaction = type === "sender" ? senderTransaction : receiverTransaction
    const transactionIdToUpdate = type === "sender" ? transactionId : receiverId
    const editForm = type === "sender" ? editFormSender : editFormReceiver
    const setTransaction = type === "sender" ? setSenderTransaction : setReceiverTransaction
    const setUser = type === "sender" ? setSenderUser : setReceiverUser

    if (!transaction || !transactionIdToUpdate) {
      console.log("DEBUG: No transaction or transaction ID to update")
      return
    }

    setSaving(true)
    setSuccess(null)
    setError(null)

    try {
      console.log("DEBUG: Sending update request with body:", editForm)
      const response = await fetch(`/api/admin/transactions/${transactionIdToUpdate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...editForm,
          amount: isNaN(editForm.amount) ? 0 : editForm.amount,
          cryptoAmount: isNaN(editForm.cryptoAmount) ? 0 : editForm.cryptoAmount,
          cryptoPrice: isNaN(editForm.cryptoPrice) ? 0 : editForm.cryptoPrice,
        }),
      })
      console.log("DEBUG: Update response status:", response.status)
      if (!response.ok) {
        const errorData = await response.text()
        console.log("DEBUG: Update error response:", errorData)
        throw new Error(`Failed to update transaction: ${errorData}`)
      }
      const { transaction: updatedTransaction, userBalance, userCryptoBalance } = await response.json()
      console.log("DEBUG: Updated transaction data:", updatedTransaction)
      setTransaction(updatedTransaction)
      setUser((prev) =>
        prev
          ? { ...prev, balance: userBalance, cryptoBalance: userCryptoBalance || prev.cryptoBalance }
          : prev
      )
      setSuccess("Transaction updated successfully")
      setEditMode((prev) => ({ ...prev, [type]: false }))
      console.log("DEBUG: Transaction updated successfully")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update transaction"
      console.error("DEBUG: Error in handleSaveChanges:", errorMessage)
      setError(errorMessage)
    } finally {
      setSaving(false)
      console.log("DEBUG: handleSaveChanges completed")
    }
  }

  const handleRefundTransaction = async () => {
    console.log("DEBUG: Starting handleRefundTransaction...")
    if (!senderTransaction || !senderUser) {
      console.log("DEBUG: No sender transaction or sender user to refund")
      return
    }

    setSaving(true)
    setSuccess(null)
    setError(null)

    try {
      const transferType = {
        isInternalTransfer: senderTransaction.category === "Transfer",
        isZelleTransfer: senderTransaction.category === "Zelle",
        isExternalTransfer: senderTransaction.category === "External Transfer",
      }

      console.log("DEBUG: Transfer type:", transferType)

      const requestBody: any = {
        senderTransactionId: senderTransaction.id,
        ...transferType,
      }

      if (receiverTransaction) {
        requestBody.receiverTransactionId = receiverTransaction.id
      }

      console.log("DEBUG: Refund request body:", requestBody)

      const refundEndpoint = `/api/admin/transactions/${senderTransaction.id}`
      console.log("DEBUG: Sending refund request to:", refundEndpoint)
      const res = await fetch(refundEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })
      console.log("DEBUG: Refund response status:", res.status)

      if (!res.ok) {
        const errorDataText = await res.text()
        console.log("DEBUG: Refund error response text:", errorDataText)
        let errorData
        try {
          errorData = JSON.parse(errorDataText)
          console.log("DEBUG: Refund error data parsed:", errorData)
        } catch (parseError) {
          console.error("DEBUG: Failed to parse refund error response as JSON:", parseError)
          throw new Error(`Failed to process refund: ${errorDataText}`)
        }
        throw new Error(errorData.error || "Failed to process refund")
      }

      const responseData = await res.json()
      console.log("DEBUG: Refund response parsed:", responseData)

      const { message, refundTransactions } = responseData
      console.log("DEBUG: Refund message:", message)
      console.log("DEBUG: Refund transactions:", refundTransactions)
      setSuccess(message)

      setRefundedTransactions((prev) => {
        const existingIds = new Set(prev.map((tx) => tx.id))
        const newRefunds = refundTransactions.filter((tx: Transaction) => !existingIds.has(tx.id))
        console.log("DEBUG: New refunds to add:", newRefunds)
        return [...prev, ...newRefunds]
      })

      const userIds = new Set(refundTransactions.map((tx: Transaction) => tx.userId))
      console.log("DEBUG: User IDs to update:", Array.from(userIds))
      const userPromises = Array.from(userIds).map((userId) =>
        fetch(`/api/admin/users/${userId}`, { credentials: "include" }).then((res) => {
          console.log(`DEBUG: Fetch user ${userId} response status:`, res.status)
          if (!res.ok) throw new Error(`Failed to fetch user ${userId}`)
          return res.json()
        })
      )
      const userDataArray = await Promise.all(userPromises)
      console.log("DEBUG: Updated user data:", userDataArray)
      userDataArray.forEach((data) => {
        const user = data.user
        if (user.id === senderTransaction.userId) {
          setSenderUser(user)
          console.log("DEBUG: Updated sender user:", user)
        }
        if (receiverTransaction && user.id === receiverTransaction.userId) {
          setReceiverUser(user)
          console.log("DEBUG: Updated receiver user:", user)
        }
      })

      if (senderTransaction) {
        console.log("DEBUG: Fetching sender refunds post-refund...")
        const senderRefundsRes = await fetch(`/api/admin/transactions?relatedTransactionId=${senderTransaction.id}`, {
          credentials: "include",
        })
        console.log("DEBUG: Sender refunds post-refund response status:", senderRefundsRes.status)
        if (senderRefundsRes.ok) {
          const { transactions: senderRefunds } = await senderRefundsRes.json()
          console.log("DEBUG: Sender refunds post-refund:", senderRefunds)
          setRefundedTransactions((prev) => {
            const existingIds = new Set(prev.map((tx) => tx.id))
            const newRefunds = senderRefunds.filter((tx: Transaction) => !existingIds.has(tx.id))
            return [...prev, ...newRefunds]
          })
        }
      }
      if (receiverTransaction) {
        console.log("DEBUG: Fetching receiver refunds post-refund...")
        const receiverRefundsRes = await fetch(`/api/admin/transactions?relatedTransactionId=${receiverTransaction.id}`, {
          credentials: "include",
        })
        console.log("DEBUG: Receiver refunds post-refund response status:", receiverRefundsRes.status)
        if (receiverRefundsRes.ok) {
          const { transactions: receiverRefunds } = await receiverRefundsRes.json()
          console.log("DEBUG: Receiver refunds post-refund:", receiverRefunds)
          setRefundedTransactions((prev) => {
            const existingIds = new Set(prev.map((tx) => tx.id))
            const newRefunds = receiverRefunds.filter((tx: Transaction) => !existingIds.has(tx.id))
            return [...prev, ...newRefunds]
          })
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during refund"
      console.error("DEBUG: Refund error:", errorMessage)
      setError(errorMessage)
    } finally {
      setSaving(false)
      setConfirmRefund(false)
      console.log("DEBUG: handleRefundTransaction completed")
    }
  }

  if (loading) {
    console.log("DEBUG: Rendering loading state...")
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-700" />
      </div>
    )
  }

  if (!senderTransaction || !senderUser) {
    console.log("DEBUG: Rendering transaction not found state...")
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <X className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold text-primary-900">Transaction Not Found</h2>
          <p className="mt-2 text-primary-600">The requested transaction could not be found.</p>
          <Button asChild className="mt-6 bg-primary-600 hover:bg-primary-700">
            <Link href="/admin/transactions">Back to Transactions</Link>
          </Button>
        </div>
      </div>
    )
  }

  const getBadgeVariant = (status: Transaction["status"]): "default" | "secondary" | "destructive" => {
    console.log("DEBUG: Getting badge variant for status:", status)
    switch (status) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      default:
        return "default"
    }
  }

  const isInternalTransfer = senderTransaction.category === "Transfer"
  const isZelleTransfer = senderTransaction.category === "Zelle"
  const isExternalTransfer = senderTransaction.category === "External Transfer"
  const isGroupTransaction = (isZelleTransfer && !!receiverTransaction && !!receiverUser) || isInternalTransfer

  console.log("DEBUG: Transfer types - Internal:", isInternalTransfer, "Zelle:", isZelleTransfer, "External:", isExternalTransfer)
  console.log("DEBUG: Is group transaction:", isGroupTransaction)

  // Determine the title based on the transfer type
  const senderAccount = senderTransaction.type
  const receiverAccount = receiverTransaction?.type
  let transferTitle = "Transaction Details"
  if (isInternalTransfer && senderAccount && receiverAccount) {
    transferTitle = `From ${senderAccount.charAt(0).toUpperCase() + senderAccount.slice(1)} to ${receiverAccount.charAt(0).toUpperCase() + receiverAccount.slice(1)}`
  } else if (isZelleTransfer) {
    transferTitle = `${senderUser.fullName} transferred $${Math.abs(senderTransaction.amount).toFixed(2)} to ${receiverUser?.fullName || "Unknown"} (Zelle)`
  } else if (isExternalTransfer) {
    transferTitle = `External Transfer: ${senderTransaction.description}`
  } else {
    transferTitle = `${senderUser.fullName} - ${senderTransaction.description}`
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
        <Button
          variant="ghost"
          asChild
          className="p-0 mb-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100 transition-colors"
        >
          <Link href={backLink}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:items-end gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
                {transferTitle}
              </h1>
              <p className="text-primary-600">
                Sender Transaction ID: <span className="font-mono">{senderTransaction.id}</span>
                {receiverTransaction && (
                  <>
                    {" | Receiver Transaction ID: "}
                    <span className="font-mono">{receiverTransaction.id}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {senderTransaction.category === "admin" && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    Admin transactions are non-refundable.
                  </AlertDescription>
                </Alert>
              )}
              {!editMode.sender && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode((prev) => ({ ...prev, sender: true }))}
                    className="bg-white/60 border-primary-200 text-primary-700 hover:bg-primary-50 hover:text-primary-800 hover:border-primary-300"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {!isInternalTransfer && (<Button
                    variant="secondary"
                    onClick={() => setConfirmRefund(true)}
                    disabled={saving || senderTransaction.category === "admin"}
                    className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200 hover:text-yellow-800 disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200"
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {isGroupTransaction || isInternalTransfer ? "Refund Both Transactions" : "Refund Transaction"}
                  </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
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
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary-900 flex items-center gap-2">
                Sender Details {senderAccount ? `(From ${senderAccount.charAt(0).toUpperCase() + senderAccount.slice(1)})` : ""}
                <Badge
                  variant={getBadgeVariant(senderTransaction.status)}
                  className={
                    senderTransaction.status === "completed"
                      ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                      : senderTransaction.status === "pending"
                      ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                      : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                  }
                >
                  {senderTransaction.status.charAt(0).toUpperCase() + senderTransaction.status.slice(1)}
                </Badge>
              </CardTitle>
              <CardDescription className="text-primary-600">Details of the sender's transaction</CardDescription>
            </CardHeader>
            <CardContent>
              {editMode.sender ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sender-description" className="text-primary-800 font-medium">Description</Label>
                    <Input
                      id="sender-description"
                      value={editFormSender.description}
                      onChange={(e) => setEditFormSender({ ...editFormSender, description: e.target.value })}
                      className="border-primary-200 focus:ring-primary-500 bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender-amount" className="text-primary-800 font-medium">Amount</Label>
                    <Input
                      id="sender-amount"
                      type="number"
                      step="0.01"
                      value={editFormSender.amount}
                      onChange={(e) => setEditFormSender({ ...editFormSender, amount: parseFloat(e.target.value) || 0 })}
                      className="border-primary-200 focus:ring-primary-500 bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender-type" className="text-primary-800 font-medium">Type</Label>
                    <Select
                      value={editFormSender.type}
                      onValueChange={(value) => setEditFormSender({ ...editFormSender, type: value as Transaction["type"] })}
                    >
                      <SelectTrigger id="sender-type" className="border-primary-200 bg-white/50">
                        <SelectValue />
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
                  <div className="space-y-2">
                    <Label htmlFor="sender-category" className="text-primary-800 font-medium">Category</Label>
                    <Input
                      id="sender-category"
                      value={editFormSender.category}
                      onChange={(e) => setEditFormSender({ ...editFormSender, category: e.target.value })}
                      className="border-primary-200 focus:ring-primary-500 bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender-status" className="text-primary-800 font-medium">Status</Label>
                    <Select
                      value={editFormSender.status}
                      onValueChange={(value) => setEditFormSender({ ...editFormSender, status: value as Transaction["status"] })}
                    >
                      <SelectTrigger id="sender-status" className="border-primary-200 bg-white/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender-memo" className="text-primary-800 font-medium">Memo</Label>
                    <Textarea
                      id="sender-memo"
                      value={editFormSender.memo}
                      onChange={(e) => setEditFormSender({ ...editFormSender, memo: e.target.value })}
                      className="border-primary-200 focus:ring-primary-500 bg-white/50"
                    />
                  </div>
                  {(editFormSender.type === "crypto_buy" || editFormSender.type === "crypto_sell") && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="sender-cryptoAmount" className="text-primary-800 font-medium">Crypto Amount</Label>
                        <Input
                          id="sender-cryptoAmount"
                          type="number"
                          step="0.000001"
                          value={editFormSender.cryptoAmount}
                          onChange={(e) => setEditFormSender({ ...editFormSender, cryptoAmount: parseFloat(e.target.value) || 0 })}
                          className="border-primary-200 focus:ring-primary-500 bg-white/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sender-cryptoPrice" className="text-primary-800 font-medium">Crypto Price</Label>
                        <Input
                          id="sender-cryptoPrice"
                          type="number"
                          step="0.01"
                          value={editFormSender.cryptoPrice}
                          onChange={(e) => setEditFormSender({ ...editFormSender, cryptoPrice: parseFloat(e.target.value) || 0 })}
                          className="border-primary-200 focus:ring-primary-500 bg-white/50"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditMode((prev) => ({ ...prev, sender: false }))}
                      className="w-full border-primary-300 text-primary-700 hover:bg-primary-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSaveChanges("sender")}
                      className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                    >
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
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
                      {getTransactionIcon(senderTransaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-primary-900">{senderTransaction.description}</p>
                      <p className="text-sm text-primary-600 capitalize">{senderTransaction.type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <Separator className="bg-primary-100" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-primary-600">Amount</p>
                      <p className={`text-lg font-medium ${senderTransaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {senderTransaction.amount >= 0 ? "+" : ""}${Math.abs(senderTransaction.amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-600">Date</p>
                      <p className="text-lg font-medium text-primary-900">{new Date(senderTransaction.date).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-600">Account Type</p>
                      <p className="text-lg font-medium text-primary-900">{senderAccount || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-primary-600">Category</p>
                      <p className="text-lg font-medium text-primary-900">{senderTransaction.category || "Uncategorized"}</p>
                    </div>
                    {senderTransaction.memo && (
                      <div className="col-span-2">
                        <p className="text-sm text-primary-600">Memo</p>
                        <p className="text-lg font-medium text-primary-900">{senderTransaction.memo}</p>
                      </div>
                    )}
                    {(senderTransaction.type === "crypto_buy" || senderTransaction.type === "crypto_sell") && (
                      <>
                        <div>
                          <p className="text-sm text-primary-600">Crypto Amount</p>
                          <p className="text-lg font-medium text-primary-900">{senderTransaction.cryptoAmount?.toFixed(6) || "0.000000"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-primary-600">Crypto Price</p>
                          <p className="text-lg font-medium text-primary-900">${senderTransaction.cryptoPrice?.toFixed(2) || "0.00"}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="bg-primary-100">
                  <AvatarFallback className="text-primary-600">{senderUser.fullName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-primary-900">{senderUser.fullName}</p>
                  <p className="text-sm text-primary-600">{senderUser.email}</p>
                </div>
              </div>
              <p className="text-sm text-primary-600">Account: {senderUser.accountNumber}</p>
              <p className="text-sm text-primary-600">Balance: ${senderUser.balance.toFixed(2)}</p>
              {senderUser.cryptoBalance !== 0 && (
                <p className="text-sm text-primary-600">Crypto Balance: {senderUser.cryptoBalance.toFixed(6)}</p>
              )}
              <Button asChild variant="link" className="p-0 h-auto text-primary-700 hover:text-primary-900">
                <Link href={`/admin/users/${senderUser.id}`}>View User Profile</Link>
              </Button>
            </CardFooter>
          </Card>
          {(isGroupTransaction || isInternalTransfer) && receiverTransaction && receiverUser && (
            <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg">
              <CardHeader>
                <CardTitle className="text-primary-900 flex items-center gap-2">
                  Receiver Details {receiverAccount ? `(To ${receiverAccount.charAt(0).toUpperCase() + receiverAccount.slice(1)})` : ""}
                  <Badge
                    variant={getBadgeVariant(receiverTransaction.status)}
                    className={
                      receiverTransaction.status === "completed"
                        ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                        : receiverTransaction.status === "pending"
                        ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                        : "bg-red-100 text-red-800 border-red-200 hover:bg-red-200"
                    }
                  >
                    {receiverTransaction.status.charAt(0).toUpperCase() + receiverTransaction.status.slice(1)}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-primary-600">Details of the receiver's transaction</CardDescription>
              </CardHeader>
              <CardContent>
                {editMode.receiver ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="receiver-description" className="text-primary-800 font-medium">Description</Label>
                      <Input
                        id="receiver-description"
                        value={editFormReceiver.description}
                        onChange={(e) => setEditFormReceiver({ ...editFormReceiver, description: e.target.value })}
                        className="border-primary-200 focus:ring-primary-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiver-amount" className="text-primary-800 font-medium">Amount</Label>
                      <Input
                        id="receiver-amount"
                        type="number"
                        step="0.01"
                        value={editFormReceiver.amount}
                        onChange={(e) => setEditFormReceiver({ ...editFormReceiver, amount: parseFloat(e.target.value) || 0 })}
                        className="border-primary-200 focus:ring-primary-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiver-type" className="text-primary-800 font-medium">Type</Label>
                      <Select
                        value={editFormReceiver.type}
                        onValueChange={(value) => setEditFormReceiver({ ...editFormReceiver, type: value as Transaction["type"] })}
                      >
                        <SelectTrigger id="receiver-type" className="border-primary-200 bg-white/50">
                          <SelectValue />
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
                    <div className="space-y-2">
                      <Label htmlFor="receiver-category" className="text-primary-800 font-medium">Category</Label>
                      <Input
                        id="receiver-category"
                        value={editFormReceiver.category}
                        onChange={(e) => setEditFormReceiver({ ...editFormReceiver, category: e.target.value })}
                        className="border-primary-200 focus:ring-primary-500 bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiver-status" className="text-primary-800 font-medium">Status</Label>
                      <Select
                        value={editFormReceiver.status}
                        onValueChange={(value) => setEditFormReceiver({ ...editFormReceiver, status: value as Transaction["status"] })}
                      >
                        <SelectTrigger id="receiver-status" className="border-primary-200 bg-white/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiver-memo" className="text-primary-800 font-medium">Memo</Label>
                      <Textarea
                        id="receiver-memo"
                        value={editFormReceiver.memo}
                        onChange={(e) => setEditFormReceiver({ ...editFormReceiver, memo: e.target.value })}
                        className="border-primary-200 focus:ring-primary-500 bg-white/50"
                      />
                    </div>
                    {(editFormReceiver.type === "crypto_buy" || editFormReceiver.type === "crypto_sell") && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="receiver-cryptoAmount" className="text-primary-800 font-medium">Crypto Amount</Label>
                          <Input
                            id="receiver-cryptoAmount"
                            type="number"
                            step="0.000001"
                            value={editFormReceiver.cryptoAmount}
                            onChange={(e) => setEditFormReceiver({ ...editFormReceiver, cryptoAmount: parseFloat(e.target.value) || 0 })}
                            className="border-primary-200 focus:ring-primary-500 bg-white/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="receiver-cryptoPrice" className="text-primary-800 font-medium">Crypto Price</Label>
                          <Input
                            id="receiver-cryptoPrice"
                            type="number"
                            step="0.01"
                            value={editFormReceiver.cryptoPrice}
                            onChange={(e) => setEditFormReceiver({ ...editFormReceiver, cryptoPrice: parseFloat(e.target.value) || 0 })}
                            className="border-primary-200 focus:ring-primary-500 bg-white/50"
                          />
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditMode((prev) => ({ ...prev, receiver: false }))}
                        className="w-full border-primary-300 text-primary-700 hover:bg-primary-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveChanges("receiver")}
                        className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
                      >
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
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full flex items-center justify-center bg-muted">
                        {getTransactionIcon(receiverTransaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-primary-900">{receiverTransaction.description}</p>
                        <p className="text-sm text-primary-600 capitalize">{receiverTransaction.type.replace("_", " ")}</p>
                      </div>
                    </div>
                    <Separator className="bg-primary-100" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-primary-600">Amount</p>
                        <p className={`text-lg font-medium ${receiverTransaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {receiverTransaction.amount >= 0 ? "+" : ""}${Math.abs(receiverTransaction.amount).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-600">Date</p>
                        <p className="text-lg font-medium text-primary-900">{new Date(receiverTransaction.date).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-600">Account Type</p>
                        <p className="text-lg font-medium text-primary-900">{receiverAccount || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-primary-600">Category</p>
                        <p className="text-lg font-medium text-primary-900">{receiverTransaction.category || "Uncategorized"}</p>
                      </div>
                      {receiverTransaction.memo && (
                        <div className="col-span-2">
                          <p className="text-sm text-primary-600">Memo</p>
                          <p className="text-lg font-medium text-primary-900">{receiverTransaction.memo}</p>
                        </div>
                      )}
                      {(receiverTransaction.type === "crypto_buy" || receiverTransaction.type === "crypto_sell") && (
                        <>
                          <div>
                            <p className="text-sm text-primary-600">Crypto Amount</p>
                            <p className="text-lg font-medium text-primary-900">{receiverTransaction.cryptoAmount?.toFixed(6) || "0.000000"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-primary-600">Crypto Price</p>
                            <p className="text-lg font-medium text-primary-900">${receiverTransaction.cryptoPrice?.toFixed(2) || "0.00"}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="bg-primary-100">
                    <AvatarFallback className="text-primary-600">{receiverUser.fullName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-primary-900">{receiverUser.fullName}</p>
                    <p className="text-sm text-primary-600">{receiverUser.email}</p>
                  </div>
                </div>
                <p className="text-sm text-primary-600">Account: {receiverUser.accountNumber}</p>
                <p className="text-sm text-primary-600">Balance: ${receiverUser.balance.toFixed(2)}</p>
                {receiverUser.cryptoBalance !== 0 && (
                  <p className="text-sm text-primary-600">Crypto Balance: {receiverUser.cryptoBalance.toFixed(6)}</p>
                )}
                <Button asChild variant="link" className="p-0 h-auto text-primary-700 hover:text-primary-900">
                  <Link href={`/admin/users/${receiverUser.id}`}>View User Profile</Link>
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        <Dialog open={confirmRefund} onOpenChange={setConfirmRefund}>
          <DialogContent className="bg-white/90 backdrop-blur-sm border border-primary-100">
            <DialogHeader>
              <DialogTitle className="text-primary-900">Confirm Refund</DialogTitle>
              <DialogDescription className="text-primary-600">
                {isGroupTransaction || isInternalTransfer
                  ? "Are you sure you want to refund both transactions in this group? This will credit the sender and debit the receiver."
                  : "Are you sure you want to refund this transaction? This action cannot be undone."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmRefund(false)}
                className="border-primary-300 text-primary-700 hover:bg-primary-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefundTransaction}
                disabled={saving}
                className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Refund"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}