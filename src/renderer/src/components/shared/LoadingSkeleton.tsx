export function ServiceCardSkeleton() {
  return (
    <div className="p-4 bg-card border rounded-xl shadow-sm animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-5 bg-muted rounded-full w-16"></div>
      </div>
      <div className="h-3 bg-muted rounded w-1/4"></div>
      
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 bg-muted rounded w-8"></div>
            <div className="h-1.5 bg-muted rounded-full flex-1"></div>
            <div className="h-3 bg-muted rounded w-10"></div>
          </div>
        ))}
        <div className="flex justify-between mt-2">
          <div className="h-3 bg-muted rounded w-10"></div>
          <div className="h-3 bg-muted rounded w-12"></div>
        </div>
      </div>
    </div>
  )
}

export function SummaryCardSkeleton() {
  return (
    <div className="p-3 bg-card border rounded-xl shadow-sm animate-pulse flex items-center gap-2.5 min-w-0">
      <div className="h-4 w-4 bg-muted rounded shrink-0"></div>
      <div className="min-w-0 flex-1">
        <div className="h-5 bg-muted rounded w-1/3"></div>
        <div className="h-2 bg-muted rounded w-1/2 mt-1"></div>
      </div>
    </div>
  )
}

export function ServiceDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 h-full animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 bg-muted rounded-md"></div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="h-8 bg-muted rounded w-48"></div>
              <div className="h-5 bg-muted rounded-full w-20"></div>
            </div>
            <div className="h-4 bg-muted rounded w-32"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 bg-muted rounded w-24"></div>
          <div className="h-8 bg-muted rounded w-24"></div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="h-3.5 bg-muted rounded w-12"></div>
              <div className="h-4 bg-muted rounded w-4"></div>
            </div>
            <div className="h-7 bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col gap-4 mt-2">
        <div className="h-9 bg-muted rounded-md w-full max-w-md"></div>
        <div className="flex-1 border rounded-md p-4 bg-card">
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-48 bg-muted rounded w-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

