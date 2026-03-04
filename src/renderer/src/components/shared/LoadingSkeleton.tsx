export function ServiceCardSkeleton() {
  return (
    <div className="p-4 border rounded-xl animate-pulse space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-5 bg-muted rounded-full w-16"></div>
      </div>
      <div className="h-3 bg-muted rounded w-1/4"></div>
      <div className="space-y-2">
        <div className="h-1.5 bg-muted rounded-full w-full"></div>
        <div className="h-1.5 bg-muted rounded-full w-full"></div>
        <div className="h-1.5 bg-muted rounded-full w-full"></div>
      </div>
      <div className="flex justify-between mt-2">
        <div className="h-3 bg-muted rounded w-10"></div>
        <div className="h-3 bg-muted rounded w-12"></div>
      </div>
    </div>
  )
}

export function SummaryCardSkeleton() {
  return (
    <div className="p-4 border rounded-xl animate-pulse flex items-center gap-3">
      <div className="h-5 w-5 bg-muted rounded"></div>
      <div className="space-y-1.5 flex-1">
        <div className="h-6 bg-muted rounded w-1/2"></div>
        <div className="h-3 bg-muted rounded w-1/3"></div>
      </div>
    </div>
  )
}

