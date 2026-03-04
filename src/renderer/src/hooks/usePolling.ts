/**
 * Generic polling hook for periodic data fetching.
 *
 * Features:
 * - Immediate first fetch with loading state
 * - Subsequent fetches are silent (no loading flicker)
 * - Preserves stale data on error
 * - Manual refresh support
 * - Configurable enable/disable
 */
import { useState, useEffect, useCallback, useRef } from 'react'

interface UsePollingOptions {
  enabled?: boolean
  onError?: (error: Error) => void
}

interface UsePollingResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  lastUpdated: Date | null
  refresh: () => void
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  options: UsePollingOptions = {}
): UsePollingResult<T> {
  const { enabled = true, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isFirstFetch = useRef(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const doFetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      setData(result)
      setError(null)
      setLastUpdated(new Date())
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
    } finally {
      if (isFirstFetch.current) {
        setIsLoading(false)
        isFirstFetch.current = false
      }
    }
  }, [onError])

  useEffect(() => {
    // Perform initial fetch on mount
    if (isFirstFetch.current) {
      doFetch()
    }

    if (!enabled) return

    const id = setInterval(doFetch, intervalMs)
    return () => clearInterval(id)
  }, [enabled, intervalMs, doFetch])

  const refresh = useCallback(() => {
    doFetch()
  }, [doFetch])

  return { data, isLoading, error, lastUpdated, refresh }
}
