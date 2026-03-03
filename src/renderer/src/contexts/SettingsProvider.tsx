import React, { createContext, useContext, useState } from 'react'
import { storage } from '../utils/storage'

interface Settings {
  pollingInterval: number
  autoRefresh: boolean
}

const DEFAULT_SETTINGS: Settings = {
  pollingInterval: 15000,
  autoRefresh: true
}

interface SettingsContextType extends Settings {
  updateSettings: (newSettings: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    storage.get<Settings>('app-settings', DEFAULT_SETTINGS)
  )

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      storage.set('app-settings', updated)
      return updated
    })
  }

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
