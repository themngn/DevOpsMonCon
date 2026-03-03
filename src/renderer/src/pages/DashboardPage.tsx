import ErrorState from '../components/shared/ErrorState'
import EmptyState from '../components/shared/EmptyState'
import {
  SummaryCardSkeleton,
  ServiceCardSkeleton
} from '../components/shared/LoadingSkeleton'

import { useState, useMemo, useEffect } from 'react'
import { useServer } from '../contexts/ServerProvider'
import { useSettings } from '../hooks/useSettings'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'

import * as api from '../services/api'
import { usePolling } from '../hooks/usePolling'
import { useRelativeTime } from '../hooks/useRelativeTime'

//тимчасово
import type { Service } from '../types'
import ServiceCard from '../components/ServiceCard'

/*const mock: Service = {
  id: '1',
  name: 'api-gateway',
  status: 'healthy',
  uptime: 12345,
  cpu: 45,
  ram: 32,
  disk: 20,
  iops: 120,
  ip: '127.0.0.1',
  port: 3000,
  version: '1.0.0'
}
  */
//тимчасово

export default function DashboardPage() {
  const { activeServer } = useServer()
  const { pollingInterval, autoRefresh } = useSettings()

  //локальні стани
  const [period, setPeriod] = useState(5)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] =
    useState<'status' | 'name' | 'cpu' | 'ram'>('status')

  //polling
  const {
    data: services,
    isLoading,
    error,
    lastUpdated,
    refresh
  } = usePolling(
    () => api.getServices(period),
    pollingInterval,
    { enabled: autoRefresh }
  )
  useEffect(() => {
    refresh()
  }, [period, refresh])

  const relativeLastUpdated = useRelativeTime(lastUpdated)
  //const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  //const [lastPing, setLastPing] = useState<string>('-')
  const summary = useMemo(() => {
    if (!services)
      return { total: 0, healthy: 0, degraded: 0, critical: 0 }

    return {
      total: services.length,
      healthy: services.filter(s => s.status === 'healthy').length,
      degraded: services.filter(s => s.status === 'degraded').length,
      critical: services.filter(
        s => s.status === 'critical' || s.status === 'down'
      ).length
    }
  }, [services])

  const processedServices = useMemo(() => {
    if (!services) return []

    let result = [...services]

    if (search) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
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




  //tray update, якщо чогось нема то нічого не впаде
  useEffect(() => {
    if (!services) return
  
    const hasCritical = services.some(s => s.status === 'critical' || s.status === 'down')
    const hasDegraded = services.some(s => s.status === 'degraded')
  
    let trayStatus = 'green'
  
    if (hasCritical) trayStatus = 'red'
    else if (hasDegraded) trayStatus = 'yellow'
  
    window.electronAPI?.updateTrayStatus?.(
      trayStatus,
      `Services: ${services.length}`
    )
  }, [services])

/*
  // Функція для отримання даних з бекенду
  const fetchData = async () => {
    if (!activeServer) return
    
    try {
      setStatus('checking')
      const res = await fetch(activeServer.url)
      if (res.ok) {
        setStatus('online')
        setLastPing(new Date().toLocaleTimeString())
      } else {
        setStatus('offline')
      }
    } catch (error) {
      setStatus('offline')
    }
  }
*/
/* старий polling
  // Опитування сервера
  useEffect(() => {
    fetchData()
    if (!autoRefresh) return

    const interval = setInterval(fetchData, pollingInterval)
    return () => clearInterval(interval)
  }, [activeServer, autoRefresh, pollingInterval])
  */
  console.log(services)
  console.log(typeof lastUpdated, lastUpdated)
  
  //if (isLoading) return <div>Loading...</div>
  //if (error) return <div>Error: {error.message}</div>
  

  // if (isLoading) {
  //   return <div>Loading...</div>
  // }
  //заміна 
  

  // return (
  //   <div className="space-y-6">
  //     <div className="grid gap-4 md:grid-cols-3">
  //       {/* Картка статусу сервера */}
  //       <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
  //         <div className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <h3 className="tracking-tight text-sm font-medium">Server Status</h3>
  //           <Activity className="h-4 w-4 text-muted-foreground" />
  //         </div>
  //         <div className="flex items-center gap-2 mt-2">
  //           {/*
  //           {status === 'online' && <CheckCircle className="text-green-500 w-5 h-5" />}
  //           {status === 'offline' && <XCircle className="text-red-500 w-5 h-5" />}
  //           {status === 'checking' && <Activity className="text-yellow-500 w-5 h-5 animate-pulse" />}
  //           <div className="text-2xl font-bold capitalize">{status}</div>
  //           */}
  //           {services && <CheckCircle className="text-green-500 w-5 h-5" />}
  //           {error && <XCircle className="text-red-500 w-5 h-5" />}
  //           {!services && !error && (
  //             <Activity className="text-yellow-500 w-5 h-5 animate-pulse" />
  //           )}

  //           <div className="text-2xl font-bold capitalize">
  //             {error ? 'offline' : services ? 'online' : 'checking'}
  //           </div>
  //         </div>
  //         <p className="text-xs text-muted-foreground mt-1">
  //           {activeServer?.url}
  //         </p>
  //       </div>

  //       {/* Картка останнього оновлення */}
  //       <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
  //         <div className="flex flex-row items-center justify-between space-y-0 pb-2">
  //           <h3 className="tracking-tight text-sm font-medium">Last Updated</h3>
  //           <Clock className="h-4 w-4 text-muted-foreground" />
  //         </div>
  //         {/*<div className="text-2xl font-bold mt-2">{lastPing}</div> */}
          
  //         <div className="text-2xl font-bold mt-2">
  //           {/*{lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}*/}
  //           {relativeLastUpdated}
  //         </div>

  //         <p className="text-xs text-muted-foreground mt-1">
  //           Auto-refresh active
  //         </p>
  //       </div>
  //     </div>

  //     {error && (
  //       <div className="p-3 border border-red-500 text-red-400 rounded">
  //         Failed to refresh data. Showing last known state.
  //       </div>
  //     )}

  //      {/*ДОДАЄМО КАРТКИ СЕРВІСІВ */}
  //     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  //        {services?.map(service => (
  //         <ServiceCard key={service.id} service={service} />
  //       ))}
  //     </div> 

  //     {/*<ServiceCard service={mock} />*/} 

  //   </div>
  // )

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
                onChange={(e) => setSortBy(e.target.value as any)}
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
                {[1, 5, 10, 15, 30, 60].map(p => (
                  <option key={p} value={p}>{p} min</option>
                ))}
              </select>
            </div>
  
            {/* LAST UPDATED */}
            <div className="text-xs text-muted-foreground">
              Last updated: {relativeLastUpdated}
            </div>
          </div>
  
          {/* ERROR */}
          {error && (
            <ErrorState
              message="Failed to refresh data. Showing last known state."
              onRetry={refresh}
            />
          )}
  
          {/* EMPTY */}
          {!error && processedServices.length === 0 && (
            <EmptyState message="No services found" />
          )}
  
          {/* SERVICES GRID */}
          {!error && processedServices.length > 0 && (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {processedServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </>
      )}
  
    </div>
  )


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
        <div className="text-sm text-muted-foreground mb-2">
          {title}
        </div>
        <div className={`text-3xl font-bold ${colorMap[color]}`}>
          {value}
        </div>
      </div>
    )
  }
}