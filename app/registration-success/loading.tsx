import { Loader2 } from "lucide-react"

export default function RegistrationSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Loading...</h2>
        <p className="text-muted-foreground">Please wait while we process your information</p>
      </div>
    </div>
  )
}
