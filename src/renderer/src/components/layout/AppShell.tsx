import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { getStatus } from '../../services/api'
import { useSettings } from '../../hooks/useSettings'
import { useRefresh } from '../../contexts/RefreshProvider'
import { usePolling } from '../../hooks/usePolling'
import { useAlertCount } from '../../hooks/useAlertCount'

export default function AppShell() {
  const { pollingInterval, autoRefresh } = useSettings()
  const { refreshKey } = useRefresh()
  const alertCount = useAlertCount()

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
    // Ensure we have reasonable defaults if status hasn't loaded yet
    const overall = status?.overall || 'green'
    const total = status?.total || 0
    const healthy = status?.healthy || 0
    const tooltip = `DevOps Monitor | ${healthy}/${total} healthy`
    
    // Prioritize alertCount from hook, but fall back to status.activeAlerts if hook is 0
    // This handles cases where one might be slightly ahead of the other
    const effectiveAlertCount = alertCount > 0 ? alertCount : (status?.activeAlerts || 0)
    
    window.api?.updateTrayStatus?.(overall, tooltip, effectiveAlertCount)
  }, [status, alertCount])

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
