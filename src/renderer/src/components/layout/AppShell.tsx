import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { getStatus } from '../../services/api'
import { useSettings } from '../../hooks/useSettings'
import { useRefresh } from '../../contexts/RefreshProvider'
import { usePolling } from '../../hooks/usePolling'

export default function AppShell() {
  const { pollingInterval, autoRefresh } = useSettings()
  const { refreshKey } = useRefresh()

  // Use polling hook for consistent data fetching
  const { data: status, refresh: forceRefreshStatus } = usePolling(
    getStatus,
    pollingInterval,
    { enabled: autoRefresh }
  )

  // Force refresh status when global refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      forceRefreshStatus()
    }
  }, [refreshKey, forceRefreshStatus])

  // Global tray update
  useEffect(() => {
    if (status) {
      const { overall, total, healthy, activeAlerts } = status
      const tooltip = `DevOps Monitor | ${healthy}/${total} healthy`
      window.api?.updateTrayStatus?.(overall, tooltip, activeAlerts)
    }
  }, [status])

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex flex-col flex-1 min-h-0 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
