import { cn } from '../../lib/utils'
import type { ServiceStatus } from '../../types/index'

export function StatusBadge({ status, className }: { status: ServiceStatus; className?: string }) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold'
  let colorClass = ''

  switch (status) {
    case 'healthy':
      colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      break
    case 'degraded':
      colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      break
    case 'critical':
      colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      break
    case 'down':
      colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
      break
  }

  return <span className={cn(base, colorClass, className)}>{status}</span>
}
