import React, { createContext, useContext, useState, useEffect } from 'react'
import type { AppSettings } from '../types'

interface SettingsContextType {
  settings: AppSettings | null
  updateSettings: (settings: AppSettings) => Promise<void>
  loading: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load settings on mount
    (window.api as any)
      .getSettings()
      .then((loaded) => {
        setSettings(loaded)
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const updateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings)
    await window.api.saveSettings(newSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
