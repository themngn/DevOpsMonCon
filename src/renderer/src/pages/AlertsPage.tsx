import { useState, useCallback, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, CheckCircle, Loader2, ShieldAlert, Filter, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dropdown } from '../components/ui/Dropdown'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '../components/Pagination'
import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { useSettings } from '@/hooks/useSettings'
import { useRefresh } from '@/contexts/RefreshProvider'
import { getAlerts, acknowledgeAlert } from '@/services/api'
import type { Alert, AlertSeverity, AlertStatus } from '@/types/index'
import { Switch } from '../components/ui/Switch'
import { Label } from '../components/ui/Label'
import { ToggleGroup, ToggleGroupItem } from '../components/ui/ToggleGroup'
import { Bell, BellOff } from 'lucide-react'

// Use "all" as sentinel since empty strings aren't valid option values
const ALL = 'all'

interface Filters {
  severity: string // "all" | "critical" | "warning" | "info"
  status: string // "all" | "active" | "acknowledged"
  timeRange: string // "all" | "3600" | "86400" | "604800"
}

interface AlertState extends Alert {
  isLoading?: boolean
  rowError?: string
}

const SEVERITY_OPTIONS = [
  { label: 'All', value: ALL },
  { label: 'Critical', value: 'critical' },
  { label: 'Warnings', value: 'warning' },
  { label: 'Info', value: 'info' }
]

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: ALL },
  { label: 'Active', value: 'active' },
  { label: 'Acknowledged', value: 'acknowledged' }
]

const TIME_RANGE_OPTIONS = [
  { label: 'All time', value: ALL },
  { label: 'Last hour', value: '3600' },
  { label: 'Last 24h', value: '86400' },
  { label: 'Last 7 days', value: '604800' }
]

const PAGE_SIZE = 20
const SKELETON_ROWS = 5

// Map dropdown values to server-side API params
const severityParam = (v: string): string | undefined => {
  if (v === ALL) return undefined
  // values match the API directly: 'critical' | 'warning' | 'info'
  return v
}

const statusParam = (v: string): string | undefined => {
  if (v === ALL) return undefined
  // values match the API directly: 'active' | 'acknowledged'
  return v
}

export default function AlertsPage() {
  const { pollingInterval, autoRefresh, notificationsEnabled, notificationThreshold, updateSettings } = useSettings()
  const { refreshKey, triggerRefresh, reportLastUpdated } = useRefresh()
  const [alerts, setAlerts] = useState<AlertState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<Filters>({
    severity: ALL,
    status: ALL,
    timeRange: ALL
  })

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAlerts({
        severity: severityParam(filters.severity),
        status: statusParam(filters.status),
        page,
        limit: PAGE_SIZE,
        timeRange: filters.timeRange !== ALL ? parseInt(filters.timeRange) : undefined
      })
      setAlerts(result.items.map((a) => ({ ...a, isLoading: false, rowError: undefined })))
      setTotal(result.total)
      reportLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [filters, page, reportLastUpdated])

  // Re-fetch immediately whenever filters or page change
  useEffect(() => {
    fetchAlerts()
  }, [filters, page]) // eslint-disable-line react-hooks/exhaustive-deps

  // Also poll on interval (auto-refresh)
  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchAlerts, pollingInterval)
    return () => clearInterval(id)
  }, [autoRefresh, pollingInterval, fetchAlerts])

  // Trigger a manual refresh from the Header button
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    fetchAlerts()
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleAcknowledge = async (alertId: string, index: number) => {
    setAlerts((prev) =>
      prev.map((a, i) => (i === index ? { ...a, isLoading: true, rowError: undefined } : a))
    )
    try {
      await acknowledgeAlert(alertId)
      triggerRefresh() // Update tray count and other global status
      // We still update local row state for immediate feedback
      setAlerts((prev) =>
        prev.map((a, i) =>
          i === index ? { ...a, status: 'acknowledged', isLoading: false, rowError: undefined } : a
        )
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to acknowledge'
      setAlerts((prev) =>
        prev.map((a, i) => (i === index ? { ...a, isLoading: false, rowError: msg } : a))
      )
    }
  }

  const severityClass = (s: AlertSeverity) => {
    if (s === 'critical') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    if (s === 'warning')
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  }

  const statusClass = (s: AlertStatus) =>
    s === 'active'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'

  const formatTime = (ts: number | string) => {
    // mock-data timestamps are already in ms (Date.now()), no multiplication needed
    const d = typeof ts === 'string' ? new Date(ts) : new Date(ts as number)
    return formatDistanceToNow(d, { addSuffix: true })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Active alerts across all monitored services
          </p>
        </div>

        {/* Notification Controls */}
        <div className="flex items-center gap-4 bg-card/50 rounded-lg p-2 px-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Notifications:</span>
            <ToggleGroup 
              type="single"
              value={notificationThreshold} 
              onValueChange={(v) => {
                if (v) updateSettings({ notificationThreshold: v as any })
              }}
              variant="outline"
              size="xs"
              className="bg-muted/30 rounded-lg p-0.5"
            >
              <ToggleGroupItem value="all" className="rounded-md px-3">All</ToggleGroupItem>
              <ToggleGroupItem value="warning" className="rounded-md px-3">Warn</ToggleGroupItem>
              <ToggleGroupItem value="critical" className="rounded-md px-3">Critical</ToggleGroupItem>
              <ToggleGroupItem value="off" className="rounded-md px-3 text-destructive data-[state=on]:bg-destructive data-[state=on]:text-white">
                <BellOff className="h-3.5 w-3.5 mr-1.5" />
                Mute
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 shrink-0">
        <Dropdown
          value={filters.severity}
          options={SEVERITY_OPTIONS}
          onChange={(v) => handleFilterChange('severity', v)}
          icon={ShieldAlert}
        />
        <Dropdown
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(v) => handleFilterChange('status', v)}
          icon={Filter}
        />
        <Dropdown
          value={filters.timeRange}
          options={TIME_RANGE_OPTIONS}
          onChange={(v) => handleFilterChange('timeRange', v)}
          icon={Clock}
        />
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 rounded-lg border bg-card overflow-hidden">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-28 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Severity
                </TableHead>
                <TableHead className="w-40 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Service
                </TableHead>
                <TableHead className="py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Message
                </TableHead>
                <TableHead className="w-32 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Time
                </TableHead>
                <TableHead className="w-36 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Status
                </TableHead>
                <TableHead className="w-32 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 sticky top-0 bg-card z-10">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton rows while loading
                Array.from({ length: 15 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-border/40 hover:bg-transparent">
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <ErrorState message={error} onRetry={fetchAlerts} />
                  </TableCell>
                </TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState message="No alerts — everything looks good!" icon={CheckCircle} />
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert, idx) => (
                  <TableRow
                    key={alert.id}
                    className="group border-b border-border/40 hover:bg-muted/30 transition-colors"
                  >
                    {/* Severity */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${severityClass(alert.severity)}`}
                      >
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </span>
                    </TableCell>

                    {/* Service */}
                    <TableCell className="font-medium">{alert.serviceName}</TableCell>

                    {/* Message */}
                    <TableCell className="max-w-xs">
                      <p className="truncate">{alert.message}</p>
                    </TableCell>

                    {/* Time */}
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatTime(alert.timestamp)}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${statusClass(alert.status)}`}
                      >
                        {alert.status === 'active' ? (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Ack
                          </>
                        )}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="w-32">
                      <div className="flex flex-col justify-center min-h-[32px] w-24">
                        {alert.status === 'active' ? (
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-full"
                              onClick={() => handleAcknowledge(alert.id, idx)}
                              disabled={alert.isLoading}
                            >
                              {alert.isLoading ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                  <span className="truncate">Acking…</span>
                                </>
                              ) : (
                                'Ack'
                              )}
                            </Button>
                            {alert.rowError && (
                              <p className="text-[10px] text-destructive leading-tight absolute -bottom-4 bg-background px-1 border rounded shadow-sm z-20">
                                {alert.rowError}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {!error && (
        <div className="shrink-0">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            isLoading={loading}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      )}
    </div>
  )
}
