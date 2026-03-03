import { useEffect, useRef } from 'react'

/**
 * Calls `callback` every `interval` ms while `enabled` is true.
 * Uses a ref so that changing `callback` never restarts the timer.
 */
export function usePolling(
  callback: () => void,
  interval: number,
  enabled: boolean
): void {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    if (!enabled || interval <= 0) return
    const id = setInterval(() => savedCallback.current(), interval)
    return () => clearInterval(id)
  }, [interval, enabled])
}
