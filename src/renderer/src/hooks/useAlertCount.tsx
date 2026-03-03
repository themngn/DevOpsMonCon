import { useState, useCallback } from 'react'
import { getActiveAlertCount } from '@/services/api'
import { usePolling } from './usePolling'

export function useAlertCount() {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    try {
      const result = await getActiveAlertCount()
      setCount(result.count)
    } catch (err) {
      console.error('Failed to fetch active alert count:', err)
    }
  }, [])

  usePolling(fetchCount)

  return count
}