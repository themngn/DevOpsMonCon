//import { useEffect, useState } from 'react'
import { useServer } from '../contexts/ServerProvider'
import { useSettings } from '../hooks/useSettings'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'

import * as api from '../services/api'
import { usePolling } from '../hooks/usePolling'
import { useRelativeTime } from '../hooks/useRelativeTime'

export default function DashboardPage() {
  const { activeServer } = useServer()
  const { pollingInterval, autoRefresh } = useSettings()
  //const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  //const [lastPing, setLastPing] = useState<string>('-')
  const {
    data: services,
    isLoading,
    error,
    lastUpdated,
    //refresh
  } = usePolling(
    () => api.getServices(5),
    pollingInterval,
    { enabled: autoRefresh }
  )
  const relativeLastUpdated = useRelativeTime(lastUpdated)

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
  
  //if (isLoading) return <div>Loading...</div>
  //if (error) return <div>Error: {error.message}</div>
  if (isLoading) {
    return <div>Loading...</div>
  }


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Картка статусу сервера */}
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Server Status</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            {/*
            {status === 'online' && <CheckCircle className="text-green-500 w-5 h-5" />}
            {status === 'offline' && <XCircle className="text-red-500 w-5 h-5" />}
            {status === 'checking' && <Activity className="text-yellow-500 w-5 h-5 animate-pulse" />}
            <div className="text-2xl font-bold capitalize">{status}</div>
            */}
            {services && <CheckCircle className="text-green-500 w-5 h-5" />}
            {error && <XCircle className="text-red-500 w-5 h-5" />}
            {!services && !error && (
              <Activity className="text-yellow-500 w-5 h-5 animate-pulse" />
            )}

            <div className="text-2xl font-bold capitalize">
              {error ? 'offline' : services ? 'online' : 'checking'}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {activeServer?.url}
          </p>
        </div>

        {/* Картка останнього оновлення */}
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Last Updated</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          {/*<div className="text-2xl font-bold mt-2">{lastPing}</div> */}
          
          <div className="text-2xl font-bold mt-2">
            {/*{lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}*/}
            {relativeLastUpdated}
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            Auto-refresh active
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-red-500 text-red-400 rounded">
          Failed to refresh data. Showing last known state.
        </div>
      )}

       {/*ДОДАЄМО КАРТКИ СЕРВІСІВ */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {services?.map(service => (
        <div key={service.id} className="p-4 border rounded">
          <div className="font-bold">{service.name}</div>
          <div>Status: {service.status}</div>
          <div>CPU: {service.cpu.toFixed(1)}%</div>
          <div>RAM: {service.ram.toFixed(1)}%</div>
          <div>Disk: {service.disk.toFixed(1)}%</div>
        </div>
           ))}
      </div>

    </div>
  )
}