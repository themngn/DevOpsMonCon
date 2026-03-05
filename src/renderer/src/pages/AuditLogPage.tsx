import { useState, useEffect } from 'react'
import { useRefresh } from '../contexts/RefreshProvider'
import { format, fromUnixTime, parseISO, isValid } from 'date-fns'
import { Search, X, Shield, Clock } from 'lucide-react'
import { getAuditLogs } from '../services/api'
import { useSettings } from '../hooks/useSettings'
import { usePolling } from '@/hooks/usePolling'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { Button } from '@/components/ui/button'
import { Dropdown } from '../components/ui/Dropdown'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const PAGE_SIZE = 50
const ALL = 'all'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTs(ts: number | string): string {
  try {
    let date: Date
    if (typeof ts === 'number') {
      date = fromUnixTime(ts > 1e10 ? ts / 1000 : ts)
    } else {
      date = parseISO(ts)
    }
    if (!isValid(date)) return String(ts)
    return format(date, 'MMM d HH:mm:ss')
  } catch {
    return String(ts)
  }
}

const TIME_RANGE_OPTIONS = [
  { label: 'All time', value: ALL },
  { label: 'Last hour', value: '3600' },
  { label: 'Last 24h', value: '86400' },
  { label: 'Last 7 days', value: '604800' },
  { label: 'Last 30 days', value: '2592000' }
]

// ── skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows({ count = 15 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="border-b border-border/40 hover:bg-transparent">
          <TableCell className="py-2.5">
            <Skeleton className="h-3.5 w-28" />
          </TableCell>
          <TableCell className="py-2.5">
            <Skeleton className="h-3.5 w-24" />
          </TableCell>
          <TableCell className="py-2.5">
            <Skeleton className="h-3.5 w-24" />
          </TableCell>
          <TableCell className="py-2.5">
            <Skeleton className="h-3.5 w-24" />
          </TableCell>
          <TableCell className="py-2.5">
            <Skeleton className="h-3.5 w-3/4" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const { pollingInterval, autoRefresh } = useSettings()
  const { refreshKey, reportLastUpdated } = useRefresh()

  // filter state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [timeRange, setTimeRange] = useState<string>(ALL)
  const [page, setPage] = useState(1)

  // ── debounce search 300ms ──────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // reset to page 1 on new search
    }, 300)
    return () => clearTimeout(id)
  }, [search])

  const handleTimeRangeChange = (val: string) => {
    setTimeRange(val)
    setPage(1)
  }

  // ── fetch ──────────────────────────────────────────────────────────────────
  const {
    data,
    isLoading: loading,
    error: pollingError,
    refresh
  } = usePolling(
    () =>
      getAuditLogs({
        search: debouncedSearch || undefined,
        timeRange: timeRange !== ALL ? parseInt(timeRange) : undefined,
        page,
        limit: PAGE_SIZE
      }),
    pollingInterval,
    { enabled: autoRefresh }
  )

  // Report fetch time to global context
  useEffect(() => {
    if (data) reportLastUpdated(new Date())
  }, [data, reportLastUpdated])

  // Re-fetch immediately when filters or page change
  useEffect(() => {
    refresh()
  }, [debouncedSearch, timeRange, page, refresh])

  // Trigger a manual refresh from the Header button
  useEffect(() => {
    if (refreshKey > 0) refresh()
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const error = pollingError?.message || null

  // ── derived ────────────────────────────────────────────────────────────────
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const logs = data?.items ?? []

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setTimeRange(ALL)
    setPage(1)
  }

  const hasFilters = search !== '' || timeRange !== ALL

  const timeLabel =
    {
      all: 'All time',
      '3600': 'Last hour',
      '86400': 'Last 24h',
      '604800': 'Last 7 days',
      '2592000': 'Last 30 days'
    }[timeRange] || timeRange

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3 h-full min-h-0">
        {/* ── Filter bar ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search with icon */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search audit logs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-64 rounded-md border border-input bg-background pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Time range filter */}
          <Dropdown
            value={timeRange}
            options={TIME_RANGE_OPTIONS}
            onChange={handleTimeRangeChange}
            icon={Clock}
          />

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-1.5 ml-1">
              {timeRange !== ALL && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  Time: {timeLabel}
                  <button
                    onClick={() => {
                      setTimeRange(ALL)
                      setPage(1)
                    }}
                    className="hover:text-foreground ml-0.5"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground max-w-64">
                  <span className="truncate">
                    Search: &ldquo;
                    {debouncedSearch.length > 16
                      ? debouncedSearch.slice(0, 16) + '…'
                      : debouncedSearch}
                    &rdquo;
                  </span>
                  <button
                    onClick={() => {
                      setSearch('')
                      setPage(1)
                    }}
                    className="hover:text-foreground ml-0.5 shrink-0"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-36 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Timestamp
                </TableHead>
                <TableHead className="w-48 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  User
                </TableHead>
                <TableHead className="w-36 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Action
                </TableHead>
                <TableHead className="w-36 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Target
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Details
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonRows count={15} />
              ) : error ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="p-0">
                    <ErrorState message="Failed to load audit logs" onRetry={() => refresh()} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      message="No audit logs matching your filters"
                      action={
                        hasFilters ? (
                          <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear filters
                          </Button>
                        ) : undefined
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="group border-b border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    {/* Timestamp */}
                    <TableCell className="py-2.5 text-[11px] font-mono tabular-nums text-muted-foreground/60 whitespace-nowrap select-none">
                      {formatTs(log.timestamp)}
                    </TableCell>

                    {/* User */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                           <Shield className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-[13px] font-medium text-foreground/80 truncate max-w-[160px]">
                          {log.user}
                        </span>
                      </div>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="py-2.5">
                       <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                        {log.action}
                      </span>
                    </TableCell>

                    {/* Target */}
                    <TableCell className="py-2.5">
                      <span className="text-[13px] text-foreground/75 truncate max-w-[120px]">
                        {log.target}
                      </span>
                    </TableCell>

                    {/* Details */}
                    <TableCell className="py-2.5 max-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate text-[13px] text-foreground/90">
                            {log.details}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-md break-words text-xs">
                          {log.details}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        {!loading && !error && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
