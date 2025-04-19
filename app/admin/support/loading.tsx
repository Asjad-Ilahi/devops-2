import { Skeleton } from "@/components/ui/skeleton"

export default function AdminSupportLoading() {
  return (
    <div className="flex h-full">
      {/* Ticket List Skeleton */}
      <div className="border-r w-full md:w-1/3 lg:w-2/5">
        <div className="p-4 border-b">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-10 w-full mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[110px]" />
            <Skeleton className="h-10 w-[110px]" />
            <Skeleton className="h-10 w-[130px]" />
          </div>
        </div>

        <div className="divide-y">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Ticket Details Skeleton (hidden on mobile) */}
      <div className="hidden md:block md:w-2/3 lg:w-3/5">
        <div className="p-4 border-b flex justify-between">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>

        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-32 w-full rounded-lg mb-1" />
              <Skeleton className="h-3 w-32 ml-2" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Skeleton className="h-24 w-full rounded-lg mb-1 ml-auto" />
              <Skeleton className="h-3 w-32 ml-auto" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          </div>
        </div>

        <div className="p-4 border-t mt-auto">
          <Skeleton className="h-[100px] w-full mb-3" />
          <div className="flex justify-between">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </div>
    </div>
  )
}
