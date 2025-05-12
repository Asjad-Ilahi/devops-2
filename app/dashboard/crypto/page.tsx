// CryptoPage Component (Updated)
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Bitcoin, DollarSign, Loader2, ArrowDownUp, Send } from "lucide-react"
import Color from 'color'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useAuth } from '@/lib/auth'
import { apiFetch } from '@/lib/api'

// Define transaction interface for type safety
interface Transaction {
  id: string
  type: "buy" | "sell" | "bitcoin_transfer"
  amount: number
  value: number
  price: number
  date: string
}

// Define colors interface
interface Colors {
  primaryColor: string
  secondaryColor: string
}

// Define raw transaction interface from API
interface RawTransaction {
  _id: string
  type: "crypto_buy" | "crypto_sell" | "bitcoin_transfer"
  cryptoAmount: number
  amount: number
  cryptoPrice: number
  date: string
  memo?: string
  recipientWallet?: string
}

export default function CryptoPage() {
  const router = useRouter()

  // States initialized to default values
  const [accountBalance, setAccountBalance] = useState<number>(0)
  const [cryptoBalance, setCryptoBalance] = useState<number>(0)
  const [cryptoValue, setCryptoValue] = useState<number>(0)
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [colors, setColors] = useState<Colors | null>(null)

  // Transaction states
  const [buyAmount, setBuyAmount] = useState<string>("")
  const [buyEquivalent, setBuyEquivalent] = useState<string>("0")
  const [sellAmount, setSellAmount] = useState<string>("")
  const [sellEquivalent, setSellEquivalent] = useState<string>("0")
  const [sendAmount, setSendAmount] = useState<string>("")
  const [sendWallet, setSendWallet] = useState<string>("")
  const [sendMemo, setSendMemo] = useState<string>("")
  const [isBuySwapped, setIsBuySwapped] = useState<boolean>(false)
  const [isSellSwapped, setIsSellSwapped] = useState<boolean>(false)
  const [showSendPopup, setShowSendPopup] = useState<boolean>(false)
  const [pendingSend, setPendingSend] = useState<{ amount: number; wallet: string; memo: string } | null>(null)

  // Transaction history initialized as empty array
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Use the auth hook to handle token validation and expiration
  useAuth()

  // Fetch colors (public endpoint, no auth required)
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch('/api/colors')
        if (!response.ok) {
          throw new Error('Failed to fetch colors')
        }
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
      } catch (error: unknown) {
        console.error('Error fetching colors:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
    fetchColors()
  }, [])

  // Function to map raw transactions to the Transaction interface with validation
  const mapRawTransactions = (rawTransactions: RawTransaction[]): Transaction[] => {
    return rawTransactions
      .filter((tx) => 
        tx._id && 
        (tx.type === "crypto_buy" || tx.type === "crypto_sell" || tx.type === "bitcoin_transfer") &&
        typeof tx.cryptoAmount === 'number' &&
        typeof tx.amount === 'number' &&
        typeof tx.cryptoPrice === 'number' &&
        tx.date
      )
      .map((tx) => ({
        id: tx._id,
        type: tx.type === "crypto_buy" ? "buy" : tx.type === "crypto_sell" ? "sell" : "bitcoin_transfer",
        amount: Math.abs(tx.cryptoAmount) || 0,
        value: Math.abs(tx.amount) || 0,
        price: tx.cryptoPrice || 0,
        date: new Date(tx.date).toLocaleString() || new Date().toLocaleString(),
      }))
  }

  // Effect to fetch initial data and set up price updates
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch user data
        const userResponse = await apiFetch("/api/user")
        if (!userResponse.ok) throw new Error("Failed to fetch user data")
        const userData = await userResponse.json()
        setAccountBalance(userData.balance || 0)
        setCryptoBalance(userData.cryptoBalance || 0)

        // Fetch BTC price (public endpoint, no auth required)
        const priceResponse = await fetch("/api/price")
        if (!priceResponse.ok) throw new Error("Failed to fetch BTC price")
        const priceData = await priceResponse.json()
        const newBtcPrice: number = priceData.bitcoin?.usd || 0
        const newPriceChange: number = priceData.bitcoin?.usd_24h_change || 0
        setBtcPrice(newBtcPrice)
        setPriceChange(newPriceChange)
        setCryptoValue((userData.cryptoBalance || 0) * newBtcPrice)

        // Fetch transactions
        const txResponse = await apiFetch("/api/transactions")
        if (!txResponse.ok) throw new Error("Failed to fetch transactions")
        const txData = await txResponse.json()
        setTransactions(mapRawTransactions(txData.transactions || []))
      } catch (error: unknown) {
        if (error instanceof Error && error.message !== 'Unauthorized') {
          setError(error.message)
        } else {
          setError("Failed to load data")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Update BTC price every 10 minutes
    const priceInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/price")
        if (!response.ok) throw new Error("Price update failed")
        const data = await response.json()
        const newBtcPrice: number = data.bitcoin?.usd || 0
        const newPriceChange: number = data.bitcoin?.usd_24h_change || 0
        setBtcPrice(newBtcPrice)
        setPriceChange(newPriceChange)
        setCryptoValue(cryptoBalance * newBtcPrice)
      } catch (error: unknown) {
        console.error("Price update error:", error instanceof Error ? error.message : 'Unknown error')
      }
    }, 600000) // 10 minutes = 600,000 ms

    return () => clearInterval(priceInterval)
  }, [cryptoBalance])

  // Calculate buy equivalent based on swap state
  useEffect(() => {
    if (buyAmount && btcPrice) {
      const amount = Number.parseFloat(buyAmount)
      if (!isBuySwapped) {
        const btc = amount / btcPrice
        setBuyEquivalent(btc.toFixed(8))
      } else {
        const usd = amount * btcPrice
        setBuyEquivalent(usd.toFixed(2))
      }
    } else {
      setBuyEquivalent("0")
    }
  }, [buyAmount, btcPrice, isBuySwapped])

  // Clear buy input when swapping
  useEffect(() => {
    setBuyAmount("")
    setBuyEquivalent("0")
  }, [isBuySwapped])

  // Calculate sell equivalent based on swap state
  useEffect(() => {
    if (sellAmount && btcPrice) {
      const amount = Number.parseFloat(sellAmount)
      if (!isSellSwapped) {
        const usdEquivalent = amount * btcPrice
        setSellEquivalent(usdEquivalent.toFixed(2))
      } else {
        const btcEquivalent = amount / btcPrice
        setSellEquivalent(btcEquivalent.toFixed(8))
      }
    } else {
      setSellEquivalent("0")
    }
  }, [sellAmount, btcPrice, isSellSwapped])

  // Clear sell input when swapping
  useEffect(() => {
    setSellAmount("")
    setSellEquivalent("0")
  }, [isSellSwapped])

  // Validate Bitcoin wallet address (simplified pattern for demonstration)
  const validateWalletAddress = (address: string): boolean => {
    // Bitcoin addresses typically start with 1, 3, or bc1 and are 26-35 characters long (simplified check)
    const btcAddressPattern = /^(1|3|bc1)[A-Za-z0-9]{25,34}$/
    return btcAddressPattern.test(address)
  }

  // Handle buy BTC with real API call
  const handleBuyBTC = async () => {
    setError(null)
    setSuccess(null)

    if (!buyAmount || Number.parseFloat(buyAmount) <= 0) {
      setError("Please enter a valid amount to buy")
      return
    }

    const amount = Number.parseFloat(buyAmount)
    let usdCost: number
    let btcToBuy: number

    if (!isBuySwapped) {
      usdCost = amount
      btcToBuy = amount / btcPrice
    } else {
      btcToBuy = amount
      usdCost = amount * btcPrice
    }

    if (usdCost > accountBalance) {
      setError("Insufficient funds in your account")
      return
    }

    setIsLoading(true)

    try {
      const response = await apiFetch("/api/crypto-transfer", {
        method: "POST",
        body: JSON.stringify({
          action: "buy",
          amount: btcToBuy,
          btcPrice,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to buy BTC")
      }

      const data = await response.json()
      setAccountBalance(data.newCheckingBalance || 0)
      setCryptoBalance(data.newCryptoBalance || 0)
      setCryptoValue((data.newCryptoBalance || 0) * btcPrice)
      setSuccess(data.message)
      setBuyAmount("")

      // Refetch transactions
      const txResponse = await apiFetch("/api/transactions")
      if (!txResponse.ok) throw new Error("Failed to fetch transactions")
      const txData = await txResponse.json()
      setTransactions(mapRawTransactions(txData.transactions || []))
    } catch (error: unknown) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        setError(error.message)
      } else {
        setError("Failed to complete the purchase")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle sell BTC with real API call
  const handleSellBTC = async () => {
    setError(null)
    setSuccess(null)

    if (!sellAmount || Number.parseFloat(sellAmount) <= 0) {
      setError("Please enter a valid amount to sell")
      return
    }

    let btcToSell: number
    if (!isSellSwapped) {
      btcToSell = Number.parseFloat(sellAmount)
    } else {
      const usdAmount = Number.parseFloat(sellAmount)
      btcToSell = usdAmount / btcPrice
    }

    if (btcToSell > cryptoBalance) {
      setError("Insufficient BTC in your wallet")
      return
    }

    setIsLoading(true)

    try {
      const response = await apiFetch("/api/crypto-transfer", {
        method: "POST",
        body: JSON.stringify({
          action: "sell",
          amount: btcToSell,
          btcPrice,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to sell BTC")
      }

      const data = await response.json()
      setAccountBalance(data.newCheckingBalance || 0)
      setCryptoBalance(data.newCryptoBalance || 0)
      setCryptoValue((data.newCryptoBalance || 0) * btcPrice)
      setSuccess(data.message)
      setSellAmount("")

      // Refetch transactions
      const txResponse = await apiFetch("/api/transactions")
      if (!txResponse.ok) throw new Error("Failed to fetch transactions")
      const txData = await txResponse.json()
      setTransactions(mapRawTransactions(txData.transactions || []))
    } catch (error: unknown) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        setError(error.message)
      } else {
        setError("Failed to complete the sale")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle send BTC with real API call
  const handleSendBTC = async () => {
    setError(null)
    setSuccess(null)

    if (!sendAmount || Number.parseFloat(sendAmount) <= 0) {
      setError("Please enter a valid amount to send")
      return
    }

    if (!sendWallet) {
      setError("Please enter a recipient wallet address")
      return
    }

    if (!validateWalletAddress(sendWallet)) {
      setError("Invalid Bitcoin wallet address")
      return
    }

    const btcToSend = Number.parseFloat(sendAmount)
    if (btcToSend > cryptoBalance) {
      setError("Insufficient BTC in your wallet")
      return
    }

    // Show the popup before proceeding with the transaction
    setPendingSend({ amount: btcToSend, wallet: sendWallet, memo: sendMemo })
    setShowSendPopup(true)
  }

  // Confirm send BTC after popup
  const confirmSendBTC = async () => {
    if (!pendingSend) return

    setIsLoading(true)
    setShowSendPopup(false)

    try {
      const response = await apiFetch("/api/crypto-transfer", {
        method: "POST",
        body: JSON.stringify({
          action: "bitcoin_transfer",
          amount: pendingSend.amount,
          recipientWallet: pendingSend.wallet,
          memo: pendingSend.memo,
          btcPrice,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send BTC")
      }

      const data = await response.json()
      setCryptoBalance(data.newCryptoBalance || 0)
      setCryptoValue((data.newCryptoBalance || 0) * btcPrice)
      setSuccess(data.message)
      setSendAmount("")
      setSendWallet("")
      setSendMemo("")

      // Refetch transactions
      const txResponse = await apiFetch("/api/transactions")
      if (!txResponse.ok) throw new Error("Failed to fetch transactions")
      const txData = await txResponse.json()
      setTransactions(mapRawTransactions(txData.transactions || []))
    } catch (error: unknown) {
      if (error instanceof Error && error.message !== 'Unauthorized') {
        setError(error.message)
      } else {
        setError("Failed to complete the transfer")
      }
    } finally {
      setIsLoading(false)
      setPendingSend(null)
    }
  }

  // Cancel send BTC from popup
  const cancelSendBTC = () => {
    setShowSendPopup(false)
    setPendingSend(null)
    setSuccess("Bitcoin transfer cancelled")
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="p-0 mb-2 text-primary-700 hover:text-primary-900 hover:bg-primary-100 transition-colors"
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
            Bitcoin Wallet
          </h1>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-primary-800">Bitcoin Balance</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline">
                <div className="text-2xl font-bold text-primary-900">{cryptoBalance.toFixed(6)} BTC</div>
                <Bitcoin className="ml-2 h-5 w-5 text-amber-500" />
              </div>
              <p className="text-sm text-primary-700">≈ ${cryptoValue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-blue-500/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-primary-800">Current BTC Price</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline">
                <div className="text-2xl font-bold text-primary-900">${btcPrice.toFixed(2)}</div>
                <div className={`ml-2 flex items-center ${priceChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {priceChange >= 0 ? (
                    <ArrowUp className="h-4 w-4 mr-1 animate-pulse" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1 animate-pulse" />
                  )}
                  <span className="text-xs font-bold">{Math.abs(priceChange).toFixed(2)}%</span>
                </div>
              </div>
              <p className="text-sm text-primary-700">24h change</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/60 border border-primary-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-primary-800">Account Balance</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-primary-900">${accountBalance.toFixed(2)}</div>
              <DollarSign className="ml-2 h-5 w-5 text-emerald-500" />
              <p className="text-sm text-primary-700">Available for purchases</p>
            </CardContent>
          </Card>
        </div>

        {/* Success or Error Messages */}
        {success && (
          <Alert className="mb-6 bg-green-50 border border-green-200 text-green-800">
            <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Buy/Sell/Send Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="buy">
            <TabsList className="grid w-full grid-cols-3 bg-primary-100/70 p-1 rounded-lg">
              <TabsTrigger
                value="buy"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Buy Bitcoin
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Sell Bitcoin
              </TabsTrigger>
              <TabsTrigger
                value="send"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary-600 data-[state=active]:to-secondary-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Send Bitcoin
              </TabsTrigger>
            </TabsList>

            {/* Buy Tab */}
            <TabsContent
              value="buy"
              className="p-6 backdrop-blur-sm bg-white/70 border border-primary-100 rounded-lg shadow-lg mt-4"
            >
              <div className="space-y-5">
                {!isBuySwapped ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="buyAmount" className="text-primary-800 font-medium">
                        Amount (USD)
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-700 font-bold">$</div>
                        <Input
                          id="buyAmount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="pl-7 border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-3">
                      <button
                        type="button"
                        className="p-2 bg-primary-100 rounded-full hover:bg-primary-200 transition-colors"
                        onClick={() => setIsBuySwapped(!isBuySwapped)}
                      >
                        <ArrowDownUp className="h-5 w-5 text-primary-600" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-primary-800 font-medium">You'll Receive (BTC)</Label>
                      <div className="bg-primary-50/70 p-4 rounded-lg flex items-center border border-primary-100">
                        <Bitcoin className="h-5 w-5 mr-3 text-amber-500" />
                        <div>
                          <span className="font-mono text-primary-900 font-bold">{buyEquivalent}</span> BTC
                        </div>
                      </div>
                      <p className="text-xs text-primary-600 font-medium">1 BTC = ${btcPrice.toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="buyAmount" className="text-primary-800 font-medium">
                        Amount (BTC)
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Bitcoin className="h-4 w-4 text-amber-500" />
                        </div>
                        <Input
                          id="buyAmount"
                          type="number"
                          min="0.00000001"
                          step="0.00000001"
                          className="pl-8 border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00000000"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-3">
                      <button
                        type="button"
                        className="p-2 bg-primary-100 rounded-full hover:bg-primary-200 transition-colors"
                        onClick={() => setIsBuySwapped(!isBuySwapped)}
                      >
                        <ArrowDownUp className="h-5 w-5 text-primary-600" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-primary-800 font-medium">You'll Pay (USD)</Label>
                      <div className="bg-primary-50/70 p-4 rounded-lg flex items-center border border-primary-100">
                        <DollarSign className="h-5 w-5 mr-3 text-emerald-500" />
                        <div>
                          <span className="font-mono text-primary-900 font-bold">${buyEquivalent}</span> USD
                        </div>
                      </div>
                      <p className="text-xs text-primary-600 font-medium">1 BTC = ${btcPrice.toFixed(2)}</p>
                    </div>
                  </>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  onClick={handleBuyBTC}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Buy Bitcoin"
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Sell Tab */}
            <TabsContent
              value="sell"
              className="p-6 backdrop-blur-sm bg-white/70 border border-primary-100 rounded-lg shadow-lg mt-4"
            >
              <div className="space-y-5">
                {!isSellSwapped ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="sellAmount" className="text-primary-800 font-medium">
                        Amount (BTC)
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Bitcoin className="h-4 w-4 text-amber-500" />
                        </div>
                        <Input
                          id="sellAmount"
                          type="number"
                          min="0.00000001"
                          step="0.00000001"
                          className="pl-8 border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00000000"
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-primary-700">Available: {cryptoBalance.toFixed(8)} BTC</span>
                        <button
                          type="button"
                          className="text-secondary-600 hover:text-secondary-700 font-medium"
                          onClick={() => setSellAmount(cryptoBalance.toString())}
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-3">
                      <button
                        type="button"
                        className="p-2 bg-primary-100 rounded-full hover:bg-primary-200 transition-colors"
                        onClick={() => setIsSellSwapped(!isSellSwapped)}
                      >
                        <ArrowDownUp className="h-5 w-5 text-primary-600" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-primary-800 font-medium">You'll Receive (USD)</Label>
                      <div className="bg-primary-50/70 p-4 rounded-lg flex items-center border border-primary-100">
                        <DollarSign className="h-5 w-5 mr-3 text-emerald-500" />
                        <div>
                          <span className="font-mono text-primary-900 font-bold">${sellEquivalent}</span> USD
                        </div>
                      </div>
                      <p className="text-xs text-primary-600 font-medium">1 BTC = ${btcPrice.toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="sellAmount" className="text-primary-800 font-medium">
                        Amount (USD)
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-700 font-bold">$</div>
                        <Input
                          id="sellAmount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="pl-7 border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="0.00"
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-primary-700">Available: {cryptoBalance.toFixed(8)} BTC</span>
                        <button
                          type="button"
                          className="text-secondary-600 hover:text-secondary-700 font-medium"
                          onClick={() => {
                            const maxUsd = (cryptoBalance * btcPrice).toFixed(2)
                            setSellAmount(maxUsd)
                          }}
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center py-3">
                      <button
                        type="button"
                        className="p-2 bg-primary-100 rounded-full hover:bg-primary-200 transition-colors"
                        onClick={() => setIsSellSwapped(!isSellSwapped)}
                      >
                        <ArrowDownUp className="h-5 w-5 text-primary-600" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-primary-800 font-medium">BTC to Sell</Label>
                      <div className="bg-primary-50/70 p-4 rounded-lg flex items-center border border-primary-100">
                        <Bitcoin className="h-5 w-5 mr-3 text-amber-500" />
                        <div>
                          <span className="font-mono text-primary-900 font-bold">{sellEquivalent}</span> BTC
                        </div>
                      </div>
                      <p className="text-xs text-primary-600 font-medium">1 BTC = ${btcPrice.toFixed(2)}</p>
                    </div>
                  </>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  onClick={handleSellBTC}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Sell Bitcoin"
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Send Tab */}
            <TabsContent
              value="send"
              className="p-6 backdrop-blur-sm bg-white/70 border border-primary-100 rounded-lg shadow-lg mt-4"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="sendWallet" className="text-primary-800 font-medium">
                    Recipient Wallet Address
                  </Label>
                  <Input
                    id="sendWallet"
                    type="text"
                    placeholder="Enter Bitcoin wallet address"
                    className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    value={sendWallet}
                    onChange={(e) => setSendWallet(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendAmount" className="text-primary-800 font-medium">
                    Amount (BTC)
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Bitcoin className="h-4 w-4 text-amber-500" />
                    </div>
                    <Input
                      id="sendAmount"
                      type="number"
                      min="0.00000001"
                      step="0.00000001"
                      className="pl-8 border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="0.00000000"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-primary-700">Available: {cryptoBalance.toFixed(8)} BTC</span>
                    <button
                      type="button"
                      className="text-secondary-600 hover:text-secondary-700 font-medium"
                      onClick={() => setSendAmount(cryptoBalance.toString())}
                    >
                      Max
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendMemo" className="text-primary-800 font-medium">
                    Memo (Optional)
                  </Label>
                  <Input
                    id="sendMemo"
                    type="text"
                    placeholder="Add a note"
                    className="border-primary-200 bg-white/50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    value={sendMemo}
                    onChange={(e) => setSendMemo(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
                  onClick={handleSendBTC}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Send Bitcoin"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Send Confirmation Popup */}
        <Dialog open={showSendPopup} onOpenChange={setShowSendPopup}>
          <DialogContent className="sm:max-w-[425px]">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-primary-900">Payment Sent</h2>
              <button onClick={cancelSendBTC} className="text-primary-700">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex justify-center my-4">
              <Bitcoin className="h-12 w-12 text-amber-500" />
            </div>
            <p className="text-center text-primary-900">
              Payment of {pendingSend?.amount.toFixed(8)} BTC is sent successfully!
            </p>
            <p className="text-center text-sm text-primary-700 mt-2">
              Some accounts may not receive it immediately and will need you to call support at (323) 374-3366
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-primary-800">
                <span>BTC Wallet</span>
                <span className="font-medium">{pendingSend?.wallet}</span>
              </div>
              <div className="flex justify-between text-sm text-primary-800">
                <span>Amount</span>
                <span className="font-medium">{pendingSend?.amount.toFixed(8)} BTC</span>
              </div>
              <div className="flex justify-between text-sm text-primary-800">
                <span>From Account</span>
                <span className="font-medium">Crypto Wallet [...last 4]</span>
              </div>
              <div className="flex justify-between text-sm text-primary-800">
                <span>Memo</span>
                <span className="font-medium">{pendingSend?.memo || "N/A"}</span>
              </div>
            </div>
            <Button
              onClick={cancelSendBTC}
              className="w-full mt-4 bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50"
            >
              Cancel Payment
            </Button>
            {/* Automatically confirm after 5 seconds if not cancelled */}
            {showSendPopup && (
              <div className="hidden">
                {setTimeout(() => {
                  if (showSendPopup) confirmSendBTC()
                }, 10000)}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Transaction History */}
        <div>
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary-700 to-secondary-700 bg-clip-text text-transparent">
            Transaction History
          </h2>
          <Card className="backdrop-blur-sm bg-white/70 border border-primary-100 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-primary-50/50">
                      <th className="text-left p-4 text-primary-800">Type</th>
                      <th className="text-left p-4 text-primary-800">Amount</th>
                      <th className="text-left p-4 text-primary-800">Value (USD)</th>
                      <th className="text-left p-4 text-primary-800">Price</th>
                      <th className="text-left p-4 text-primary-800">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-primary-50/50 transition-colors">
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              tx.type === "buy"
                                ? "bg-green-100 text-green-800"
                                : tx.type === "sell"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {tx.type === "buy" ? (
                              <ArrowUp className="mr-1 h-3 w-3" />
                            ) : tx.type === "sell" ? (
                              <ArrowDown className="mr-1 h-3 w-3" />
                            ) : (
                              <Send className="mr-1 h-3 w-3" />
                            )}
                            {tx.type === "buy" ? "Buy" : tx.type === "sell" ? "Sell" : "Send"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-primary-900">{(tx.amount || 0).toFixed(8)}</span> BTC
                        </td>
                        <td className="p-4 font-medium text-primary-900">${(tx.value || 0).toFixed(2)}</td>
                        <td className="p-4 text-primary-700">${(tx.price || 0).toFixed(2)}</td>
                        <td className="p-4 text-primary-700">{tx.date}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-primary-500">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}