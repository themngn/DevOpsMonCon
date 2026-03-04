import { useState, useEffect } from 'react'
import { getServiceLogs } from '../../services/api'
import type { LogEntry } from '../../types/index'
import { ScrollArea } from '../ui/ScrollArea'
import { cn } from '../../lib/utils'

export function LogsTab({ serviceId }: { serviceId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const resp = await getServiceLogs(serviceId, { limit: 30, page: 1 })
        if (active) setLogs(resp.items || [])
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchLogs()
    return () => {
      active = false
    }
  }, [serviceId])

  const getBadgeClass = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="h-full w-full rounded-md border p-4 bg-background">
        {loading ? (
          <div className="flex items-center justify-center p-8">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            No recent logs found.
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const date = new Date(log.timestamp)
              const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`

              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-start gap-2 py-1 border-b last:border-0 hover:bg-muted/50 transition-colors px-2"
                >
                  <div className="flex items-center gap-3 shrink-0 sm:w-48">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeStr}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                        getBadgeClass(log.level)
                      )}
                    >
                      {log.level}
                    </span>
                  </div>
                  <span className="font-mono text-sm break-all">{log.message}</span>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
