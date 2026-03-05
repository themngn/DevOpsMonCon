import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getApiPort: () => ipcRenderer.invoke('getApiPort'),
  storeGet: (key: string) => ipcRenderer.invoke('storeGet', key),
  storeSet: (key: string, value: any) => ipcRenderer.invoke('storeSet', key, value),
  getSettings: () => ipcRenderer.invoke('getSettings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('saveSettings', settings),
  directSyncSettings: (settings: any) => ipcRenderer.send('direct-sync-settings', settings),
  updateTrayStatus: (status: string, tooltip: string, alertsCount: number) => {
    ipcRenderer.send('updateTrayStatus', status, tooltip, alertsCount)
  },
  sendNotification: (title: string, body: string) => {
    ipcRenderer.send('sendNotification', title, body)
  },
  sendTestNotification: () => {
    ipcRenderer.send('sendTestNotification')
  },
  onAlertReceived: (callback: (alert: any) => void) => {
    const sub = (_: any, alert: any) => callback(alert)
    ipcRenderer.on('alert-received', sub)
    return () => ipcRenderer.removeListener('alert-received', sub)
  },
  onNavigate: (callback: (route: string) => void) => {
    const sub = (_: any, route: string) => callback(route)
    ipcRenderer.on('navigate', sub)
    return () => ipcRenderer.removeListener('navigate', sub)
  }
}

try {
  contextBridge.exposeInMainWorld('api', api)
  contextBridge.exposeInMainWorld('electron', {
    process: { versions: process.versions },
    ipcRenderer: {
      send: (c: string, ...a: any[]) => ipcRenderer.send(c, ...a),
      on: (c: string, f: any) => {
        const s = (_: any, ...args: any[]) => f(...args)
        ipcRenderer.on(c, s)
        return () => ipcRenderer.removeListener(c, s)
      }
    }
  })
} catch (e) {
  console.error(e)
}
