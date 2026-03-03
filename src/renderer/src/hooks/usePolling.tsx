import { useEffect, useRef } from 'react'
import { useSettingsContext } from '../contexts/SettingsProvider'

/**
 * Runs `callback` immediately, then repeats it at the configured
 * pollingInterval as long as autoRefresh is enabled.
 * Safe to use with stale closures — always calls the latest callback ref.
 */
export function usePolling(callback: () => void) {
  const { pollingInterval, autoRefresh } = useSettingsContext()

  // Keep a stable ref so the interval never stales on callback identity changes
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    callbackRef.current()

    if (!autoRefresh) return

    const id = setInterval(() => callbackRef.current(), pollingInterval)
    return () => clearInterval(id)
  }, [pollingInterval, autoRefresh])
}
