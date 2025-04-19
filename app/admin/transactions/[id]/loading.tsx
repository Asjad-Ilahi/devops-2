import { Loader2 } from "lucide-react"

export default function TransactionDetailLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <h2 className="mt-4 text-xl font-medium">Loading transaction details...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we fetch the transaction information.</p>
      </div>
    </div>
  )
}
