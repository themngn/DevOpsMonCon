import { Service } from '../types'
import { StatusBadge } from './shared/StatusBadge'
import { useNavigate } from 'react-router-dom'

interface Props {
  service: Service
}

export default function ServiceCard({ service }: Props) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/services/${service.id}`)
  }

  return (
    <div
      onClick={handleClick}
      className="
        p-4
        rounded-xl
        bg-card
        border
        border-border
        shadow-sm
        hover:shadow-md
        hover:border-sidebar-primary/50
        transition-all
        cursor-pointer
        space-y-3
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold truncate">{service.name}</h3>
        <StatusBadge status={service.status} />
      </div>

      {/* UPTIME */}
      <p className="text-[11px] text-muted-foreground">
        Uptime: {formatUptime(service.uptime)}
      </p>

      {/* METRICS */}
      <div className="space-y-2">
        <Metric label="CPU" value={service.cpu} />
        <Metric label="RAM" value={service.ram} />
        <Metric label="Disk" value={service.disk} />

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">IOPS</span>
          <span className="font-mono font-medium">{Math.round(service.iops).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

/* ----------------------- */
/* Helpers */
/* ----------------------- */

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getMetricBgColor(label: string, value: number): string {
  if (label === 'CPU') {
    if (value < 60) return 'bg-emerald-500'
    if (value <= 80) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // RAM + Disk
  if (value < 70) return 'bg-emerald-500'
  if (value <= 85) return 'bg-amber-500'
  return 'bg-red-500'
}

function Metric({ label, value }: { label: string; value: number }) {
  const bgColor = getMetricBgColor(label, value)

  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-muted-foreground w-8">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${bgColor} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-10 text-right font-mono">{value.toFixed(1)}%</span>
    </div>
  )
}

