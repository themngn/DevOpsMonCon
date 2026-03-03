import type { ReactNode } from 'react'

interface EmptyStateProps {
  message: string
  action?: ReactNode
}

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <p className="text-sm">{message}</p>
      {action}
    </div>
  )
}
