import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'

interface Settings {
  pollingInterval: number
  autoRefresh: boolean
}

const DEFAULT_SETTINGS: Settings = {
  pollingInterval: 15000,
  autoRefresh: true
}

export function useSettings() {
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

  return { ...settings, updateSettings }
}