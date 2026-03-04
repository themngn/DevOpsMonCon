import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  message: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

export function EmptyState({ message, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground${
        className ? ` ${className}` : ''
      }`}
    >
      {Icon && <Icon className="h-8 w-8 opacity-50" />}
      <p className="text-sm">{message}</p>
      {action}
    </div>
  )
}
