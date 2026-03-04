import { createContext, useCallback, useContext, useState } from 'react'

interface RefreshContextValue {
  /** Incremented each time the user clicks manual refresh. Pages watch this. */
  refreshKey: number
  /** Call this from the Header refresh button. */
  triggerRefresh: () => void
  /** The most recent time any page completed a data fetch. */
  lastUpdated: Date | null
  /** Pages call this after every successful fetch so the Header can display it. */
  reportLastUpdated: (date: Date) => void
}

const RefreshContext = createContext<RefreshContextValue | null>(null)

export function RefreshProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const triggerRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const reportLastUpdated = useCallback((date: Date) => {
    setLastUpdated(date)
  }, [])

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh, lastUpdated, reportLastUpdated }}>
      {children}
    </RefreshContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRefresh(): RefreshContextValue {
  const ctx = useContext(RefreshContext)
  if (!ctx) throw new Error('useRefresh must be used inside <RefreshProvider>')
  return ctx
}
