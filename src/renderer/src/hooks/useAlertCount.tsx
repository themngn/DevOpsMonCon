import { useState, useCallback, useEffect } from 'react'
import { getActiveAlertCount } from '@/services/api'
import { useSettingsContext } from '../contexts/SettingsProvider'

export function useAlertCount() {
  const [count, setCount] = useState(0)
  const { pollingInterval, autoRefresh } = useSettingsContext()

  const fetchCount = useCallback(async () => {
    try {
      const result = await getActiveAlertCount()
      setCount(result.count)
    } catch (err) {
      console.error('Failed to fetch active alert count:', err)
    }
  }, [])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(fetchCount, pollingInterval)
    return () => clearInterval(id)
  }, [autoRefresh, pollingInterval, fetchCount])

  return count
}
