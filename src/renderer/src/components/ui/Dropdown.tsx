import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DropdownOption {
  label: string
  value: string
}

interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  icon?: LucideIcon
  className?: string
}

export function Dropdown({ value, options, onChange, icon: Icon, className }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const close = useCallback(() => setOpen(false), [])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm',
          'transition-colors hover:bg-muted/50 select-none',
          'dark:bg-input/30 dark:hover:bg-input/50',
          'h-9 min-w-[140px]'
        )}
      >
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <span className="flex-1 text-left truncate">{selected?.label ?? ''}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute left-0 top-full z-[9999] mt-1 min-w-full',
            'rounded-lg border border-border bg-popover text-popover-foreground',
            'shadow-lg ring-1 ring-foreground/10',
            'py-1 animate-in fade-in-0 zoom-in-95 duration-100'
          )}
        >
          {options.map((opt) => {
            const isActive = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  close()
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm cursor-default',
                  'transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'font-medium'
                )}
              >
                <span className="flex-1 text-left">{opt.label}</span>
                {isActive && <Check className="h-4 w-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
