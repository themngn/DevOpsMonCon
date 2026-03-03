import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../../../components/ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onPrev: () => void
  onNext: () => void
}

export function Pagination({ page, totalPages, total, onPrev, onNext }: PaginationProps) {
  return (
    <div className="flex items-center justify-between border-t border-border/40 pt-2 text-sm text-muted-foreground">
      <span className="text-xs text-muted-foreground/70">
        <span className="font-medium text-foreground">{total}</span> total entries
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={page <= 1}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-2 text-xs tabular-nums">
          Page <span className="font-medium text-foreground">{page}</span> of{' '}
          <span className="font-medium text-foreground">{totalPages}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={page >= totalPages}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
