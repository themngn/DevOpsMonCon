import React, { createContext, useContext, useState, useEffect } from 'react'
import { ServerEntry } from '../types'
import { storage } from '../utils/storage'

interface ServerContextType {
  activeServer: ServerEntry | null
  loading: boolean
  connect: (server: ServerEntry) => void
  disconnect: () => void
}

const ServerContext = createContext<ServerContextType | undefined>(undefined)

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [activeServer, setActiveServer] = useState<ServerEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = storage.get<ServerEntry | null>('activeServer', null)
    if (saved) {
      setActiveServer(saved)
    }
    setLoading(false)
  }, [])

  const connect = (server: ServerEntry) => {
    setActiveServer(server)
    storage.set('activeServer', server)
  }

  const disconnect = () => {
    setActiveServer(null)
    storage.set('activeServer', null)
  }

  return (
    <ServerContext.Provider value={{ activeServer, loading, connect, disconnect }}>
      {children}
    </ServerContext.Provider>
  )
}

export function useServer() {
  const context = useContext(ServerContext)
  if (context === undefined) {
    throw new Error('useServer must be used within a ServerProvider')
  }
  return context
}
