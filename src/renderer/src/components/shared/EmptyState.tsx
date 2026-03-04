import { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  message: string
  action?: ReactNode
}

export default function EmptyState({ icon, message, action }: Props) {
  return (
    <div className="p-10 border rounded text-center text-muted-foreground">
      <div className="mb-4 flex justify-center">{icon}</div>
      <div className="mb-4">{message}</div>
      {action}
    </div>
  )
}