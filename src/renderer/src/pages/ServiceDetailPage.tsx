import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Cpu, HardDrive, Clock, Activity, Box } from 'lucide-react'
import { getService, restartService, drainService } from '../services/api'
import type { Service } from '../types/index'
import { Button } from '../components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { StatusBadge } from '../components/shared/StatusBadge'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { MetricsTab } from '../components/services/MetricsTab'
import { LogsTab } from '../components/services/LogsTab'
import { AlertSettingsTab } from '../components/services/AlertSettingsTab'

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [service, setService] = useState<Service | null>(null)

  const [isRestartOpen, setIsRestartOpen] = useState(false)
  const [isDrainOpen, setIsDrainOpen] = useState(false)
  const [actionStatus, setActionStatus] = useState<{
    type: 'success' | 'error' | 'loading' | 'indeterminate'
    message?: string
  } | null>(null)

  const fetchService = useCallback(async () => {
    if (!id) return
    try {
      const data = await getService(id)
      setService(data)
    } catch (err) {
      console.error(err)
    }
  }, [id])

  useEffect(() => {
    fetchService()
    const interval = setInterval(fetchService, 5000)
    return () => clearInterval(interval)
  }, [fetchService])

  const handleRestart = async () => {
    if (!id) return
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
    return <div className="p-8">Loading service details...</div>
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{service.name}</h1>
          <StatusBadge status={service.status} />
          <span className="text-sm text-muted-foreground mr-2">v{service.version}</span>
          <span className="text-sm text-muted-foreground">
            Uptime: {Math.floor(service.uptime / 60)}m
          </span>
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
            variant="outline"
            className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
            onClick={() => setIsRestartOpen(true)}
          >
            Restart
          </Button>
          <Button variant="destructive" onClick={() => setIsDrainOpen(true)}>
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
        onConfirm={handleRestart}
      />

      <ConfirmDialog
        open={isDrainOpen}
        onOpenChange={setIsDrainOpen}
        title="Drain Service?"
        description="Stop new connections. Existing complete. Continue?"
        confirmLabel="Drain"
        variant="destructive"
        onConfirm={handleDrain}
      />

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <InfoCard title="CPU" value={`${service.cpu.toFixed(1)}%`} icon={Cpu} />
        <InfoCard title="RAM" value={`${service.ram.toFixed(1)}%`} icon={Activity} />
        <InfoCard title="Disk" value={`${service.disk.toFixed(1)}%`} icon={HardDrive} />
        <InfoCard title="IOPs" value={Math.round(service.iops)} icon={Activity} />
        <InfoCard title="Uptime" value={`${Math.floor(service.uptime / 60)}m`} icon={Clock} />
        <InfoCard title="Version" value={`v${service.version}`} icon={Box} />
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
