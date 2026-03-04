import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { SummaryCardSkeleton, ServiceCardSkeleton } from '../components/shared/LoadingSkeleton'

import { useState, useMemo, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useRefresh } from '../contexts/RefreshProvider'

import * as api from '../services/api'
import { usePolling } from '../hooks/usePolling'

import ServiceCard from '../components/ServiceCard'
import { Dropdown } from '../components/ui/Dropdown'
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Search, 
  ArrowUpDown, 
  Timer,
  RefreshCw
} from 'lucide-react'

const SORT_OPTIONS = [
  { label: 'By Status', value: 'status' },
  { label: 'By Name', value: 'name' },
  { label: 'By CPU', value: 'cpu' },
  { label: 'By RAM', value: 'ram' }
]

const PERIOD_OPTIONS = [
  { label: 'Avg 1 min', value: '1' },
  { label: 'Avg 5 min', value: '5' },
  { label: 'Avg 10 min', value: '10' },
  { label: 'Avg 15 min', value: '15' },
  { label: 'Avg 30 min', value: '30' },
  { label: 'Avg 60 min', value: '60' }
]

function SummaryCard({
  title,
  value,
  icon: Icon,
  color = 'text-foreground'
}: {
  title: string
  value: number
  icon: any
  color?: string
}) {
  return (
    <div className="p-3 rounded-xl border bg-card shadow-sm flex items-center gap-2.5 min-w-0">
      <Icon className={`h-4 w-4 ${color} shrink-0`} />
      <div className="min-w-0 flex-1">
        <div className="text-xl font-bold truncate leading-none">{value}</div>
        <div className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-semibold mt-1">{title}</div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { pollingInterval, autoRefresh } = useSettings()
  const { refreshKey, reportLastUpdated } = useRefresh()

  const [period, setPeriod] = useState(5)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'status' | 'name' | 'cpu' | 'ram'>('status')

  //polling
  const {
    data: services,
    isLoading,
    error,
    lastUpdated,
    refresh
  } = usePolling(() => api.getServices(period), pollingInterval, { enabled: autoRefresh })
  
  useEffect(() => {
    refresh()
  }, [period, refresh])

  // Trigger a manual refresh from the Header button
  useEffect(() => {
    if (refreshKey > 0) refresh()
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Report fetch time to global context so the Header can display it
  useEffect(() => {
    if (lastUpdated) reportLastUpdated(lastUpdated)
  }, [lastUpdated, reportLastUpdated])

  const summary = useMemo(() => {
    if (!services) return { total: 0, healthy: 0, degraded: 0, critical: 0 }

    return {
      total: services.length,
      healthy: services.filter((s) => s.status === 'healthy').length,
      degraded: services.filter((s) => s.status === 'degraded').length,
      critical: services.filter((s) => s.status === 'critical' || s.status === 'down').length
    }
  }, [services])

  const processedServices = useMemo(() => {
    if (!services) return []

    let result = [...services]

    if (search) {
      result = result.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)

        case 'cpu':
          return b.cpu - a.cpu

        case 'ram':
          return b.ram - a.ram

        case 'status': {
          const order = {
            critical: 0,
            down: 0,
            degraded: 1,
            healthy: 2
          }

          return order[a.status] - order[b.status]
        }

        default:
          return 0
      }
    })

    return result
  }, [services, search, sortBy])

  return (
    <div className="space-y-6">
      {isLoading ? (
        <>
          {/* SUMMARY SKELETON */}
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SummaryCardSkeleton key={i} />
            ))}
          </div>

          {/* SERVICES SKELETON */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
            <SummaryCard title="Total" value={summary.total} icon={Activity} />
            <SummaryCard title="Healthy" value={summary.healthy} icon={CheckCircle} color="text-emerald-500" />
            <SummaryCard title="Degraded" value={summary.degraded} icon={AlertTriangle} color="text-amber-500" />
            <SummaryCard title="Critical / Down" value={summary.critical} icon={XCircle} color="text-red-500" />
          </div>

          {/* ERROR BANNER FOR STALE DATA */}
          {error && services && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>Failed to refresh — showing stale data</span>
              <button 
                onClick={() => refresh()}
                className="ml-auto flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          )}

          {/* CONTROLS */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border rounded-md bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Dropdown 
                value={sortBy}
                options={SORT_OPTIONS}
                onChange={(v) => setSortBy(v as any)}
                icon={ArrowUpDown}
                className="min-w-[140px]"
              />
              <Dropdown 
                value={String(period)}
                options={PERIOD_OPTIONS}
                onChange={(v) => setPeriod(Number(v))}
                icon={Timer}
                className="min-w-[140px]"
              />
            </div>
          </div>

          {/* ERROR */}
          {error && !services && (
            <ErrorState
              message="Failed to refresh data. Please check your connection."
              onRetry={refresh}
            />
          )}

          {/* EMPTY */}
          {!error && processedServices.length === 0 && <EmptyState message="No services found" />}

          {/* SERVICES GRID */}
          {!error && processedServices.length > 0 && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {processedServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}


