import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { AppSettings } from '../renderer/src/types'

// Custom APIs for renderer
const api = {
  // API server
  getApiPort: () => ipcRenderer.invoke('getApiPort'),

  // Store operations
  storeGet: (key: string) => ipcRenderer.invoke('storeGet', key),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('storeSet', key, value),

  // Settings operations
  getSettings: () => ipcRenderer.invoke('getSettings'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('saveSettings', settings),

  // Tray/Notifications
  updateTrayStatus: (status: 'green' | 'yellow' | 'red', tooltip: string, alertsCount: number) => {
    ipcRenderer.send('updateTrayStatus', status, tooltip, alertsCount)
  },
  sendNotification: (title: string, body: string) => {
    ipcRenderer.send('sendNotification', title, body)
  },

  // Event listeners
  onAlertReceived: (callback: (alert: any) => void) => {
    const listener = (_: any, alert: any) => callback(alert)
    ipcRenderer.on('alert-received', listener)
    return () => ipcRenderer.removeListener('alert-received', listener)
  },
  onNavigate: (callback: (route: string) => void) => {
    const listener = (_: any, route: string) => callback(route)
    ipcRenderer.on('navigate', listener)
    return () => ipcRenderer.removeListener('navigate', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
