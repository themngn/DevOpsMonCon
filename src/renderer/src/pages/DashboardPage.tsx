import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { SummaryCardSkeleton, ServiceCardSkeleton } from '../components/shared/LoadingSkeleton'

import { useState, useMemo, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings'

import * as api from '../services/api'
import { usePolling } from '../hooks/usePolling'
import { useRelativeTime } from '../hooks/useRelativeTime'

import ServiceCard from '../components/ServiceCard'

function SummaryCard({
  title,
  value,
  color = 'neutral'
}: {
  title: string
  value: number
  color?: 'neutral' | 'green' | 'yellow' | 'red'
}) {
  const colorMap = {
    neutral: 'text-foreground',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    red: 'text-red-500'
  }

  return (
    <div className="p-6 rounded-xl border bg-card shadow-sm">
      <div className="text-sm text-muted-foreground mb-2">{title}</div>
      <div className={`text-3xl font-bold ${colorMap[color]}`}>{value}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { pollingInterval, autoRefresh } = useSettings()

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

  const relativeLastUpdated = useRelativeTime(lastUpdated)
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

  //tray update
  useEffect(() => {
    if (!services) return

    const hasCritical = services.some((s) => s.status === 'critical' || s.status === 'down')
    const hasDegraded = services.some((s) => s.status === 'degraded')
    const alertsCount = services.filter(
      (s) => s.status === 'critical' || s.status === 'down'
    ).length

    let trayStatus: 'green' | 'yellow' | 'red' = 'green'
    if (hasCritical) trayStatus = 'red'
    else if (hasDegraded) trayStatus = 'yellow'

    window.api?.updateTrayStatus?.(trayStatus, `Services: ${services.length}`, alertsCount)
  }, [services])

  return (
    <div className="space-y-8">
      {isLoading ? (
        <>
          {/* SUMMARY SKELETON */}
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SummaryCardSkeleton key={i} />
            ))}
          </div>

          {/* SERVICES SKELETON */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
            <SummaryCard title="Total" value={summary.total} />
            <SummaryCard title="Healthy" value={summary.healthy} color="green" />
            <SummaryCard title="Degraded" value={summary.degraded} color="yellow" />
            <SummaryCard title="Critical / Down" value={summary.critical} color="red" />
          </div>

          {/* CONTROLS */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <input
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-3 py-2 border rounded bg-background"
              />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'status' | 'name' | 'cpu' | 'ram')}
                className="px-3 py-2 border rounded bg-background"
              >
                <option value="status">Sort by Status</option>
                <option value="name">Sort by Name</option>
                <option value="cpu">Sort by CPU</option>
                <option value="ram">Sort by RAM</option>
              </select>

              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="px-3 py-2 border rounded bg-background"
              >
                {[1, 5, 10, 15, 30, 60].map((p) => (
                  <option key={p} value={p}>
                    {p} min
                  </option>
                ))}
              </select>
            </div>

            {/* LAST UPDATED */}
            <div className="text-xs text-muted-foreground">Last updated: {relativeLastUpdated}</div>
          </div>

          {/* ERROR */}
          {error && (
            <ErrorState
              message="Failed to refresh data. Showing last known state."
              onRetry={refresh}
            />
          )}

          {/* EMPTY */}
          {!error && processedServices.length === 0 && <EmptyState message="No services found" />}

          {/* SERVICES GRID */}
          {!error && processedServices.length > 0 && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
