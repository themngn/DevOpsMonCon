/**
 * Hook that returns a relative time string like "5s ago", "2m ago"
 * that updates every second.
 
import { useState, useEffect } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'

export function useRelativeTime(date: Date | null): string {
  const [text, setText] = useState('')

  useEffect(() => {
    if (!date) {
      setText('-')
      return
    }

    const update = (): void => {
      const diff = Date.now() - date.getTime()
      if (diff < 5000) {
        setText('just now')
      } else {
        setText(formatDistanceToNowStrict(date, { addSuffix: true }))
      }
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [date])

  return text
}
*/

import { useState, useEffect } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'

export function useRelativeTime(date: Date | null): string {
  const [text, setText] = useState('–')

  useEffect(() => {
    if (!date) {
      setText('–')
      return
    }

    const update = () => {
      const diff = Date.now() - date.getTime()

      if (diff < 2000) {
        setText('just now')
        return
      }

      const formatted = formatDistanceToNowStrict(date, {
        addSuffix: true,
        unit: 'second'
      })

      // Перетворюємо "5 seconds ago" → "5s ago"
      const short = formatted
        .replace(' seconds ago', 's ago')
        .replace(' second ago', 's ago')
        .replace(' minutes ago', 'm ago')
        .replace(' minute ago', 'm ago')
        .replace(' hours ago', 'h ago')
        .replace(' hour ago', 'h ago')

      setText(short)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [date])

  return text
}
