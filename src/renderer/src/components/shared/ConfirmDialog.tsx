import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '../ui/Dialog'
import { Button } from '../ui/Button'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'default' | 'destructive'
  delaySeconds?: number
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'default',
  delaySeconds = 0,
  onConfirm
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [countdown, setCountdown] = React.useState(delaySeconds)

  React.useEffect(() => {
    if (open && delaySeconds > 0) {
      setCountdown(delaySeconds)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
    return undefined
  }, [open, delaySeconds])

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const isButtonDisabled = loading || countdown > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            variant={variant} 
            onClick={handleConfirm} 
            disabled={isButtonDisabled}
            className="min-w-[100px]"
          >
            {loading ? 'Confirming...' : countdown > 0 ? `${confirmLabel} (${countdown}s)` : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
