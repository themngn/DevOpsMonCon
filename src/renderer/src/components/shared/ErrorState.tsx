import { AlertTriangle } from 'lucide-react'

interface Props {
  message: string
  onRetry?: () => void
}

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="p-6 border border-red-500 rounded bg-red-900/20 text-red-400 text-center">
      <div className="flex justify-center mb-3">
        <AlertTriangle size={28} />
      </div>

      <div className="mb-4">{message}</div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 border border-red-500 rounded hover:bg-red-800 transition"
        >
          Retry
        </button>
      )}
    </div>
  )
}