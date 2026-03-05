import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { storage } from '../utils/storage'
import { AppSettings } from '../types'

interface Settings extends AppSettings {}

const DEFAULT_SETTINGS: Settings = {
  pollingInterval: 15000,
  autoRefresh: true,
  notificationsEnabled: true,
  notificationThreshold: 'all'
}

interface SettingsContextType extends Settings {
  updateSettings: (newSettings: Partial<Settings>) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = storage.get<Partial<Settings>>('app-settings', {})
    return { ...DEFAULT_SETTINGS, ...saved }
  })

  // Use a ref to prevent syncing on the very first mount
  const isInitialMount = useRef(true)

  // Sync settings to Main process whenever they change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (window.api?.saveSettings) {
        window.api.saveSettings(settings)
      }
      return
    }

    if (window.api?.directSyncSettings) {
      window.api.directSyncSettings(settings)
    } else if (window.api?.saveSettings) {
      window.api.saveSettings(settings)
    }
  }, [settings])

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
