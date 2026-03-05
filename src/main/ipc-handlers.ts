import { BrowserWindow } from 'electron'
import { ipcMain } from 'electron'
import { getStore } from './store'
import type { AppSettings } from '../renderer/src/types'
import { NotificationManager } from './notifications'
import { updateTrayStatus } from './tray'

// API port
export function setupIPC(mainWindow: BrowserWindow) {
  // Get the mock API server port
  ipcMain.handle('getApiPort', () => {
    return 3001 // mock server runs on this port
  })

  // Store operations
  ipcMain.handle('storeGet', async (_, key: string) => {
    const store = await getStore()
    return store.get(key)
  })

  ipcMain.handle('storeSet', async (_, key: string, value: any) => {
    const store = await getStore()
    store.set(key, value)
    return true
  })

  // Settings operations
  ipcMain.handle('getSettings', async (): Promise<AppSettings> => {
    const store = await getStore()
    return store.get('settings')
  })

  ipcMain.handle('saveSettings', async (_, settings: AppSettings) => {
    const store = await getStore()
    store.set('settings', settings)
    return true
  })

  ipcMain.on('direct-sync-settings', async (_, settings: AppSettings) => {
    const store = await getStore()
    store.set('settings', settings)
  })

  // Tray status update
  ipcMain.on(
    'updateTrayStatus',
    (_, status: 'green' | 'yellow' | 'red', tooltip: string, alertsCount: number) => {
      updateTrayStatus(status, mainWindow, tooltip, alertsCount)
    }
  )
  // Notifications
  ipcMain.on('sendNotification', (_, title: string, body: string) => {
    NotificationManager.send(title, body, mainWindow)
  })

  // Event listeners are registered but will be triggered from main process
  // These handlers just acknowledge the registration
  ipcMain.on('onAlertReceived', (_event, alert) => {
    console.log('Alert received:', alert)
  })

  ipcMain.on('onNavigate', (_event, route) => {
    console.log('Navigate:', route)
  })
}
