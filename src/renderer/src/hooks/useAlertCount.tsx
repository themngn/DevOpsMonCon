import { useEffect, useState } from 'react'
import { getActiveAlertCount } from '@/services/api'

export function useAlertCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const result = await getActiveAlertCount()
        setCount(result.count)
      } catch (err) {
        console.error('Failed to fetch active alert count:', err)
        setCount(0)
      }
    }

    fetchCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return count
}