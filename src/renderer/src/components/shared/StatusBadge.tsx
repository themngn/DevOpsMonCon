import { cn } from '../../lib/utils'
import type { ServiceStatus } from '../../types/index'

export function StatusBadge({ status, className }: { status: ServiceStatus; className?: string }) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase'
  let colorClass = ''
  let dotClass = ''

  switch (status) {
    case 'healthy':
      colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      dotClass = 'bg-emerald-500'
      break
    case 'degraded':
      colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
      dotClass = 'bg-amber-500'
      break
    case 'critical':
      colorClass = 'bg-red-500/10 text-red-600 dark:text-red-400'
      dotClass = 'bg-red-500'
      break
    case 'down':
      colorClass = 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
      dotClass = 'bg-gray-500'
      break
    case 'restarting':
      colorClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
      dotClass = 'bg-blue-500 animate-pulse'
      break
  }

  return (
    <span className={cn(base, colorClass, className)}>
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotClass)} />
      {status}
    </span>
  )
}

