import { useState, useEffect, useRef, useCallback } from 'react'
import { format, fromUnixTime, parseISO, isValid } from 'date-fns'
import { Search, X, AlertCircle, Info, TriangleAlert, Filter } from 'lucide-react'
import { getLogs } from '../services/api'
import { useSettings } from '../hooks/useSettings'
import { usePolling } from '../hooks/usePolling'
import { Pagination } from '../components/Pagination'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import type { LogEntry, PaginatedResponse, LogLevel } from '../types/index'
import { cn } from '../lib/utils'
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

// Severity hierarchy: INFO < WARN < ERROR
// When filtering by WARN, show WARN + ERROR; when filtering by INFO, show all
const LEVEL_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Warnings + Errors', value: 'warn' },
  { label: 'Errors only', value: 'error' }
]

const LEVEL_HIERARCHY: Record<string, LogLevel[]> = {
  all: ['INFO', 'WARN', 'ERROR'],
  warn: ['WARN', 'ERROR'],
  error: ['ERROR']
}

const LEVEL_CONFIG: Record<
  LogLevel,
  { label: string; dot: string; pill: string; icon: React.ElementType }
> = {
  ERROR: {
    label: 'ERROR',
    dot: 'bg-red-500',
    pill: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/25',
    icon: AlertCircle
  },
  WARN: {
    label: 'WARN',
    dot: 'bg-yellow-400',
    pill: 'bg-yellow-400/10 text-yellow-400 ring-1 ring-yellow-400/25',
    icon: TriangleAlert
  },
  INFO: {
    label: 'INFO',
    dot: 'bg-blue-400',
    pill: 'bg-blue-400/10 text-blue-400 ring-1 ring-blue-400/25',
    icon: Info
  }
}

function LevelBadge({ level }: { level: LogLevel }) {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.INFO
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tracking-wide',
        cfg.pill
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {cfg.label}
    </span>
  )
}

// ── skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i} className="border-b border-border/40">
          <TableCell className="py-3">
            <Skeleton className="h-3.5 w-28" />
          </TableCell>
          <TableCell className="py-3">
            <Skeleton className="h-5 w-16 rounded-md" />
          </TableCell>
          <TableCell className="py-3">
            <Skeleton className="h-3.5 w-24" />
          </TableCell>
          <TableCell className="py-3">
            <Skeleton className="h-3.5 w-3/4" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function LogsPage() {
  const { pollingInterval, autoRefresh } = useSettings()

  // filter state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [level, setLevel] = useState<string>('all')
  const [page, setPage] = useState(1)

  // data state
  const [data, setData] = useState<PaginatedResponse<LogEntry> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // prevent scroll-reset on background polls
  const isBackgroundPoll = useRef(false)

  // ── debounce search 300ms ──────────────────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // reset to page 1 on new search
    }, 300)
    return () => clearTimeout(id)
  }, [search])

  // reset page on level change
  const handleLevelChange = (val: string) => {
    setLevel(val)
    setPage(1)
  }

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(
    async (background = false) => {
      if (!background) setLoading(true)
      setError(null)
      try {
        // Request all logs, then filter by severity client-side
        const result = await getLogs({
          search: debouncedSearch || undefined,
          page,
          limit: PAGE_SIZE
        })
        setData(result)
      } catch (err) {
        if (!background) {
          setError(err instanceof Error ? err.message : 'Failed to load logs')
        }
      } finally {
        if (!background) setLoading(false)
      }
    },
    [level, debouncedSearch, page]
  )

  // initial / filter/page driven fetch
  useEffect(() => {
    isBackgroundPoll.current = false
    fetchLogs(false)
  }, [fetchLogs])

  // background polling — must NOT reset scroll
  usePolling(
    () => {
      isBackgroundPoll.current = true
      return fetchLogs(true)
    },
    pollingInterval,
    { enabled: autoRefresh }
  )

  // ── derived ────────────────────────────────────────────────────────────────
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  // Client-side filter by severity level
  const allowedLevels = LEVEL_HIERARCHY[level] || LEVEL_HIERARCHY.all
  const logs = (data?.items ?? []).filter((log) => allowedLevels.includes(log.level))

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setLevel('all')
    setPage(1)
  }

  const hasFilters = search !== '' || level !== 'all'
  const levelLabel =
    {
      all: 'All',
      error: 'Errors only',
      warn: 'Warnings + Errors'
    }[level] || 'Unknown'

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
              placeholder="Search messages…"
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

          {/* Level filter */}
          <Dropdown
            value={level}
            options={LEVEL_OPTIONS}
            onChange={handleLevelChange}
            icon={Filter}
          />

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex items-center gap-1.5 ml-1">
              {level !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                  Level: {levelLabel}
                  <button
                    onClick={() => {
                      setLevel('all')
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
                <TableHead className="w-24 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Level
                </TableHead>
                <TableHead className="w-36 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Service
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Message
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonRows count={5} />
              ) : error ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="p-0">
                    <ErrorState message="Failed to load logs" onRetry={() => fetchLogs(false)} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="p-0">
                    <EmptyState
                      message="No logs matching your filters"
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

                    {/* Level badge */}
                    <TableCell className="py-2.5">
                      <LevelBadge level={log.level} />
                    </TableCell>

                    {/* Service — truncated at 128px with tooltip */}
                    <TableCell className="py-2.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="block truncate text-[13px] text-foreground/75"
                            style={{ maxWidth: 128 }}
                          >
                            {log.serviceName}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">{log.serviceName}</TooltipContent>
                      </Tooltip>
                    </TableCell>

                    {/* Message — remaining width, monospace, truncated with tooltip */}
                    <TableCell className="py-2.5 max-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate font-mono text-[12px] text-foreground/90">
                            {log.message}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xl break-all font-mono text-xs">
                          {log.message}
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
