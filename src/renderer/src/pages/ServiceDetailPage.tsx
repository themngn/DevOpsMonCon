import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ChevronLeft, 
  Cpu, 
  HardDrive, 
  Activity, 
  Power, 
  Droplets
} from 'lucide-react'
import { getService, restartService, drainService } from '../services/api'
import type { Service } from '../types/index'
import { Button } from '../components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { StatusBadge } from '../components/shared/StatusBadge'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { MetricsTab } from '../components/services/MetricsTab'
import { LogsTab } from '../components/services/LogsTab'
import { AlertSettingsTab } from '../components/services/AlertSettingsTab'
import { useSettings } from '../hooks/useSettings'
import { useRefresh } from '../contexts/RefreshProvider'
import { usePolling } from '@/hooks/usePolling'

import { ServiceDetailSkeleton } from '../components/shared/LoadingSkeleton'

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pollingInterval, autoRefresh } = useSettings()
  const [service, setService] = useState<Service | null>(null)

  const [isRestartOpen, setIsRestartOpen] = useState(false)
  const [isDrainOpen, setIsDrainOpen] = useState(false)
  const [actionStatus, setActionStatus] = useState<{
    type: 'success' | 'error' | 'loading' | 'indeterminate'
    message?: string
  } | null>(null)

  const { refreshKey, reportLastUpdated } = useRefresh()

  const fetchService = useCallback(async () => {
    if (!id) return
    try {
      const data = await getService(id)
      setService(data)
      reportLastUpdated(new Date())
    } catch (err) {
      console.error(err)
    }
  }, [id, reportLastUpdated])

  // Initial fetch + settings-aware polling
  useEffect(() => {
    fetchService()
  }, [fetchService])
  usePolling(fetchService, pollingInterval, { enabled: autoRefresh })

  // Trigger a manual refresh from the Header button
  useEffect(() => {
    if (refreshKey > 0) fetchService()
  }, [refreshKey, fetchService])

  const handleRestart = async () => {
    if (!id) return
    setIsRestartOpen(false)
    setActionStatus({ type: 'loading' })
    try {
      await restartService(id)
      setActionStatus({ type: 'success', message: 'Restarted successfully' })
      setTimeout(() => setActionStatus(null), 3000)
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Failed to restart' })
    }
  }

  const handleDrain = async () => {
    if (!id) return
    setIsDrainOpen(false)
    setActionStatus({ type: 'indeterminate' }) // indeterminate progress conceptually
    try {
      await drainService(id)
      setActionStatus({ type: 'success', message: 'Drained successfully' })
      setTimeout(() => setActionStatus(null), 3000)
    } catch (err: any) {
      setActionStatus({ type: 'error', message: err.message || 'Failed to drain' })
    }
  }

  if (!service) {
    return <ServiceDetailSkeleton />
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{service.name}</h1>
              <StatusBadge status={service.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>v{service.version}</span>
              <span>&middot;</span>
              <span>Uptime: {formatUptime(service.uptime)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {actionStatus && actionStatus.type !== 'indeterminate' && (
            <span
              className={`text-sm ${actionStatus.type === 'error' ? 'text-red-500' : actionStatus.type === 'success' ? 'text-green-500' : 'text-blue-500'}`}
            >
              {actionStatus.type === 'loading' ? 'Loading...' : actionStatus.message}
            </span>
          )}
          {actionStatus?.type === 'indeterminate' && (
            <div className="w-24 h-2 bg-muted overflow-hidden rounded-full">
              <div className="h-full bg-red-500 animate-pulse w-full"></div>
            </div>
          )}

          <Button
            variant="warning"
            size="sm"
            className="h-8"
            onClick={() => setIsRestartOpen(true)}
          >
            <Power className="mr-2 h-4 w-4" />
            Restart
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-8"
            onClick={() => setIsDrainOpen(true)}
          >
            <Droplets className="mr-2 h-4 w-4" />
            Drain
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={isRestartOpen}
        onOpenChange={setIsRestartOpen}
        title={`Restart ${service.name}?`}
        description="This will restart the service and result in ~30s downtime. Continue?"
        confirmLabel="Restart"
        variant="default"
        delaySeconds={3}
        onConfirm={handleRestart}
      />

      <ConfirmDialog
        open={isDrainOpen}
        onOpenChange={setIsDrainOpen}
        title="Drain Service?"
        description="Stop new connections. Existing complete. Continue?"
        confirmLabel="Drain"
        variant="destructive"
        delaySeconds={3}
        onConfirm={handleDrain}
      />

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard title="CPU" value={`${service.cpu.toFixed(1)}%`} icon={Cpu} />
        <InfoCard title="RAM" value={`${service.ram.toFixed(1)}%`} icon={Activity} />
        <InfoCard title="Disk" value={`${service.disk.toFixed(1)}%`} icon={HardDrive} />
        <InfoCard title="IOPs" value={Math.round(service.iops)} icon={Activity} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="w-full flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="alerts">Alert Settings</TabsTrigger>
        </TabsList>
        <div className="flex-1 mt-4 border rounded-md p-4 bg-card min-h-0 overflow-auto">
          <TabsContent value="metrics" className="h-full m-0 data-[state=inactive]:hidden">
            <MetricsTab serviceId={id!} />
          </TabsContent>
          <TabsContent value="logs" className="h-full m-0 data-[state=inactive]:hidden">
            <LogsTab serviceId={id!} />
          </TabsContent>
          <TabsContent value="alerts" className="h-full m-0 data-[state=inactive]:hidden">
            <AlertSettingsTab serviceId={id!} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function InfoCard({
  title,
  value,
  icon: Icon
}: {
  title: string
  value: string | number
  icon: any
}) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow flex flex-col p-4 gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  )
}
