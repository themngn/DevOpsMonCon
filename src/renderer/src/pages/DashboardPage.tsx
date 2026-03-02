import { useEffect, useState } from 'react'
import { useServer } from '../contexts/ServerProvider'
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function DashboardPage() {
  const { activeServer } = useServer()
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [lastPing, setLastPing] = useState<string>('-')

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

  // Опитування сервера при завантаженні та кожні 30 секунд
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [activeServer])

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
            {status === 'online' && <CheckCircle className="text-green-500 w-5 h-5" />}
            {status === 'offline' && <XCircle className="text-red-500 w-5 h-5" />}
            {status === 'checking' && <Activity className="text-yellow-500 w-5 h-5 animate-pulse" />}
            <div className="text-2xl font-bold capitalize">{status}</div>
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
          <div className="text-2xl font-bold mt-2">{lastPing}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Auto-refresh active
          </p>
        </div>
      </div>
    </div>
  )
}