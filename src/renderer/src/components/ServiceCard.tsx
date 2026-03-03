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
        p-6
        rounded-xl
        bg-card
        border
        border-border
        shadow-sm
        hover:shadow-md
        transition-all
        cursor-pointer
      "
    >
      {/* HEADER */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{service.name}</h3>
          <p className="text-xs text-muted-foreground">
            Uptime: {formatUptime(service.uptime)}
          </p>
        </div>

        <StatusBadge status={service.status} />
      </div>

      {/* METRICS */}
      <div className="space-y-3">
        <Metric label="CPU" value={service.cpu} />
        <Metric label="RAM" value={service.ram} />
        <Metric label="Disk" value={service.disk} />

        <div className="text-xs text-muted-foreground">
          IOPs: {Math.round(service.iops)}
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

function getMetricColor(label: string, value: number): string {
  if (label === 'CPU') {
    if (value < 60) return 'bg-green-500'
    if (value <= 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // RAM + Disk
  if (value < 70) return 'bg-green-500'
  if (value <= 85) return 'bg-yellow-500'
  return 'bg-red-500'
}

function Metric({ label, value }: { label: string; value: number }) {
  const color = getMetricColor(label, value)

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span>{value.toFixed(1)}%</span>
      </div>

      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}