import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  pageSize: number
  isLoading?: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  isLoading,
  onPrev,
  onNext,
  className
}: PaginationProps) {
  if (totalPages <= 0) return null

  const from = Math.min((page - 1) * pageSize + 1, total)
  const to = Math.min(page * pageSize, total)

  return (
    <div className={cn('flex items-center justify-between text-sm', className)}>
      <span className="text-muted-foreground">
        {total} total
        {total > 0 && (
          <span className="hidden sm:inline"> &mdash; {from}–{to}</span>
        )}
      </span>

      <span className="text-muted-foreground font-medium">
        Page {page} of {totalPages}
      </span>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={page === 1 || isLoading}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={page === totalPages || isLoading}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
