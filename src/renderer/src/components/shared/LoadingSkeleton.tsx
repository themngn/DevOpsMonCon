export function ServiceCardSkeleton() {
    return (
      <div className="p-4 border rounded animate-pulse space-y-3">
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        <div className="h-3 bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-700 rounded w-full"></div>
      </div>
    )
  }
  
  export function SummaryCardSkeleton() {
    return (
      <div className="p-6 border rounded animate-pulse space-y-3">
        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        <div className="h-6 bg-gray-700 rounded w-1/2"></div>
      </div>
    )
  }