import React, { createContext, useContext, useState, useEffect } from 'react'
import type { AppSettings, ServerEntry } from '../types'

declare global {
  interface Window {
    api: {
      getSettings(): unknown
      saveSettings(newSettings: AppSettings): unknown
      storeGet: (key: string) => Promise<unknown>
      storeSet: (key: string, value: unknown) => Promise<void>
    }
  }
}

interface ServerContextType {
  activeServer: ServerEntry | null
  servers: ServerEntry[]
  setActiveServer: (server: ServerEntry | null) => Promise<void>
  addServer: (server: ServerEntry) => Promise<void>
  removeServer: (id: string) => Promise<void>
  loading: boolean
}

const ServerContext = createContext<ServerContextType | undefined>(undefined)

export function ServerProvider({ children }: { children: React.ReactNode }) {
  const [servers, setServers] = useState<ServerEntry[]>([])
  const [activeServer, setActiveServerState] = useState<ServerEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load servers from store on mount
    window.api
      .storeGet('servers')
      .then((loaded) => {
        if (loaded && Array.isArray(loaded)) {
          setServers(loaded)
          // Auto-select first server if none is active
          if (loaded.length > 0) {
            setActiveServerState(loaded[0])
          }
        }
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const setActiveServer = async (server: ServerEntry | null) => {
    setActiveServerState(server)
    if (server) {
      await window.api.storeSet('activeServer', server)
    } else {
      await window.api.storeSet('activeServer', null)
    }
  }

  const addServer = async (server: ServerEntry) => {
    const updated = [...servers, server]
    setServers(updated)
    await window.api.storeSet('servers', updated)
  }

  const removeServer = async (id: string) => {
    const updated = servers.filter((s) => s.id !== id)
    setServers(updated)
    await window.api.storeSet('servers', updated)

    // If active server was removed, clear it
    if (activeServer?.id === id) {
      setActiveServerState(null)
      await window.api.storeSet('activeServer', null)
    }
  }

  return (
    <ServerContext.Provider
      value={{
        activeServer,
        servers,
        setActiveServer,
        addServer,
        removeServer,
        loading
      }}
    >
      {children}
    </ServerContext.Provider>
  )
}

export function useServer() {
  const context = useContext(ServerContext)
  if (!context) {
    throw new Error('useServer must be used within ServerProvider')
  }
  return context
}
