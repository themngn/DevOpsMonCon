import { ServiceStatus } from '../../types'

interface Props {
  status: ServiceStatus
}

export default function StatusBadge({ status }: Props) {
  const base = "px-2 py-1 text-xs rounded font-medium"

  const colors: Record<ServiceStatus, string> = {
    healthy: "bg-green-600/20 text-green-400",
    degraded: "bg-yellow-600/20 text-yellow-400",
    critical: "bg-red-600/20 text-red-400",
    down: "bg-gray-600/20 text-gray-400"
  }

  return (
    <span className={`${base} ${colors[status]}`}>
      {status}
    </span>
  )
}