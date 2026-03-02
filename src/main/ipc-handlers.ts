import { ipcMain } from 'electron'
import { getStore } from './store'
import type { AppSettings } from '../renderer/src/types'

// API port
export function setupIPC() {
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

  // Tray status update
  ipcMain.handle('updateTrayStatus', (_, status: string) => {
    // TODO: implement tray status update when tray is added
    console.log('updateTrayStatus:', status)
    return true
  })

  // Notifications
  ipcMain.handle('sendNotification', (_, title: string, options?: any) => {
    // TODO: implement native notifications
    console.log('sendNotification:', title, options)
    return true
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
