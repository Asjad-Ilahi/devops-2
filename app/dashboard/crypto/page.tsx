"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Bitcoin, DollarSign, Loader2, ArrowDownUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define transaction interface for type safety
interface Transaction {
  id: string
  type: "buy" | "sell"
  amount: number
  value: number
  price: number
  date: string
}

export default function CryptoPage() {
  const router = useRouter()

  // States initialized to default values (to be set by API)
  const [accountBalance, setAccountBalance] = useState(0)
  const [cryptoBalance, setCryptoBalance] = useState(0)
  const [cryptoValue, setCryptoValue] = useState(0)
  const [btcPrice, setBtcPrice] = useState(0)
  const [priceChange, setPriceChange] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Transaction states
  const [buyAmount, setBuyAmount] = useState("")
  const [buyEquivalent, setBuyEquivalent] = useState("0")
  const [sellAmount, setSellAmount] = useState("")
  const [sellEquivalent, setSellEquivalent] = useState("0")

  // Transaction history initialized as empty array
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Effect to fetch initial data and set up price updates
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!userResponse.ok) throw new Error("Failed to fetch user data")
        const userData = await userResponse.json()
        setAccountBalance(userData.balance || 0)
        setCryptoBalance(userData.cryptoBalance || 0)

        // Fetch BTC price
        const priceResponse = await fetch("/api/price")
        if (!priceResponse.ok) throw new Error("Failed to fetch BTC price")
        const priceData = await priceResponse.json()
        const newBtcPrice = priceData.bitcoin.usd
        const newPriceChange = priceData.bitcoin.usd_24h_change
        setBtcPrice(newBtcPrice)
        setPriceChange(newPriceChange)
        setCryptoValue((userData.cryptoBalance || 0) * newBtcPrice)

        // Fetch transactions (assuming endpoint exists)
        const txResponse = await fetch("/api/crypto-transactions", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!txResponse.ok) throw new Error("Failed to fetch transactions")
        const txData = await txResponse.json()
        setTransactions(txData.transactions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      }
    }

    fetchData()

    // Update BTC price every 10 minutes
    const priceInterval = setInterval(async () => {
      try {
        const response = await fetch("/api/price")
        if (!response.ok) throw new Error("Price update failed")
        const data = await response.json()
        const newBtcPrice = data.bitcoin.usd
        const newPriceChange = data.bitcoin.usd_24h_change
        setBtcPrice(newBtcPrice)
        setPriceChange(newPriceChange)
        setCryptoValue(cryptoBalance * newBtcPrice)
      } catch (err) {
        console.error("Price update error:", err)
      }
    }, 600000) // 10 minutes = 600,000 ms

    return () => clearInterval(priceInterval)
  }, [router, cryptoBalance])

  // Calculate equivalents when inputs change
  useEffect(() => {
    if (buyAmount && btcPrice) {
      const btcEquivalent = Number.parseFloat(buyAmount) / btcPrice
      setBuyEquivalent(btcEquivalent.toFixed(8))
    } else {
      setBuyEquivalent("0")
    }
  }, [buyAmount, btcPrice])

  useEffect(() => {
    if (sellAmount && btcPrice) {
      const usdEquivalent = Number.parseFloat(sellAmount) * btcPrice
      setSellEquivalent(usdEquivalent.toFixed(2))
    } else {
      setSellEquivalent("0")
    }
  }, [sellAmount, btcPrice])

  // Handle buy BTC with real API call
  const handleBuyBTC = async () => {
    setError(null)
    setSuccess(null)

    if (!buyAmount || Number.parseFloat(buyAmount) <= 0) {
      setError("Please enter a valid amount to buy")
      return
    }

    const buyValue = Number.parseFloat(buyAmount)
    if (buyValue > accountBalance) {
      setError("Insufficient funds in your account")
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/crypto-transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "buy",
          amount: parseFloat(buyEquivalent),
          btcPrice,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to buy BTC")

      setAccountBalance(data.newCheckingBalance)
      setCryptoBalance(data.newCryptoBalance)
      setCryptoValue(data.newCryptoBalance * btcPrice)
      setSuccess(data.message)
      setBuyAmount("")

      // Refetch transactions
      const txResponse = await fetch("/api/crypto-transactions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!txResponse.ok) throw new Error("Failed to fetch transactions")
      const txData = await txResponse.json()
      setTransactions(txData.transactions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete the purchase")
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

    const sellValue = Number.parseFloat(sellAmount)
    if (sellValue > cryptoBalance) {
      setError("Insufficient BTC in your wallet")
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/crypto-transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "sell",
          amount: sellValue,
          btcPrice,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to sell BTC")

      setAccountBalance(data.newCheckingBalance)
      setCryptoBalance(data.newCryptoBalance)
      setCryptoValue(data.newCryptoBalance * btcPrice)
      setSuccess(data.message)
      setSellAmount("")

      // Refetch transactions
      const txResponse = await fetch("/api/crypto-transactions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!txResponse.ok) throw new Error("Failed to fetch transactions")
      const txData = await txResponse.json()
      setTransactions(txData.transactions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete the sale")
    } finally {
      setIsLoading(false)
    }
  }

  // Frontend remains identical to Code-01
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="p-0 mb-2 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100 transition-colors"
          >
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
            Bitcoin Wallet
          </h1>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-indigo-800">Bitcoin Balance</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline">
                <div className="text-2xl font-bold text-indigo-900">{cryptoBalance.toFixed(6)} BTC</div>
                <Bitcoin className="ml-2 h-5 w-5 text-amber-500" />
              </div>
              <p className="text-sm text-indigo-700">≈ ${cryptoValue.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-indigo-800">Current BTC Price</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-baseline">
                <div className="text-2xl font-bold text-indigo-900">${btcPrice.toFixed(2)}</div>
                <div className={`ml-2 flex items-center ${priceChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {priceChange >= 0 ? (
                    <ArrowUp className="h-4 w-4 mr-1 animate-pulse" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1 animate-pulse" />
                  )}
                  <span className="text-xs font-bold">{Math.abs(priceChange).toFixed(2)}%</span>
                </div>
              </div>
              <p className="text-sm text-indigo-700">24h change</p>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/60 border border-indigo-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-indigo-800">Account Balance</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-indigo-900">${accountBalance.toFixed(2)}</div>
              <DollarSign className="ml-2 h-5 w-5 text-emerald-500" />
              <p className="text-sm text-indigo-700">Available for purchases</p>
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

        {/* Buy/Sell Tabs */}
        <div className="mb-8">
          <Tabs defaultValue="buy">
            <TabsList className="grid w-full grid-cols-2 bg-indigo-100/70 p-1 rounded-lg">
              <TabsTrigger
                value="buy"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Buy Bitcoin
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Sell Bitcoin
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="buy"
              className="p-6 backdrop-blur-sm bg-white/70 border border-indigo-100 rounded-lg shadow-lg mt-4"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="buyAmount" className="text-indigo-800 font-medium">
                    Amount (USD)
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-700 font-bold">$</div>
                    <Input
                      id="buyAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="pl-7 border-indigo-200 bg-white/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center py-3">
                  <div className="p-2 bg-indigo-100 rounded-full animate-bounce">
                    <ArrowDownUp className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-indigo-800 font-medium">You'll Receive (BTC)</Label>
                  <div className="bg-indigo-50/70 p-4 rounded-lg flex items-center border border-indigo-100">
                    <Bitcoin className="h-5 w-5 mr-3 text-amber-500" />
                    <div>
                      <span className="font-mono text-indigo-900 font-bold">{buyEquivalent}</span> BTC
                    </div>
                  </div>
                  <p className="text-xs text-indigo-600 font-medium">1 BTC = ${btcPrice.toFixed(2)}</p>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
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

            <TabsContent
              value="sell"
              className="p-6 backdrop-blur-sm bg-white/70 border border-indigo-100 rounded-lg shadow-lg mt-4"
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="sellAmount" className="text-indigo-800 font-medium">
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
                      className="pl-8 border-indigo-200 bg-white/50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="0.00000000"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-indigo-700">Available: {cryptoBalance.toFixed(8)} BTC</span>
                    <button
                      type="button"
                      className="text-purple-600 hover:text-purple-700 font-medium"
                      onClick={() => setSellAmount(cryptoBalance.toString())}
                    >
                      Max
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center py-3">
                  <div className="p-2 bg-indigo-100 rounded-full animate-bounce">
                    <ArrowDownUp className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-indigo-800 font-medium">You'll Receive (USD)</Label>
                  <div className="bg-indigo-50/70 p-4 rounded-lg flex items-center border border-indigo-100">
                    <DollarSign className="h-5 w-5 mr-3 text-emerald-500" />
                    <div>
                      <span className="font-mono text-indigo-900 font-bold">${sellEquivalent}</span> USD
                    </div>
                  </div>
                  <p className="text-xs text-indigo-600 font-medium">1 BTC = ${btcPrice.toFixed(2)}</p>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1"
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
          </Tabs>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
            Transaction History
          </h2>
          <Card className="backdrop-blur-sm bg-white/70 border border-indigo-100 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-indigo-50/50">
                      <th className="text-left p-4 text-indigo-800">Type</th>
                      <th className="text-left p-4 text-indigo-800">Amount</th>
                      <th className="text-left p-4 text-indigo-800">Value (USD)</th>
                      <th className="text-left p-4 text-indigo-800">Price</th>
                      <th className="text-left p-4 text-indigo-800">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                          >
                            {tx.type === "buy" ? (
                              <ArrowUp className="mr-1 h-3 w-3" />
                            ) : (
                              <ArrowDown className="mr-1 h-3 w-3" />
                            )}
                            {tx.type === "buy" ? "Buy" : "Sell"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-indigo-900">{tx.amount.toFixed(8)}</span> BTC
                        </td>
                        <td className="p-4 font-medium text-indigo-900">${tx.value.toFixed(2)}</td>
                        <td className="p-4 text-indigo-700">${tx.price.toFixed(2)}</td>
                        <td className="p-4 text-indigo-700">{tx.date}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-indigo-500">
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