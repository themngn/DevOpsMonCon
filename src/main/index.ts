import { app, shell, BrowserWindow, ipcMain } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createTray, destroyTray, updateTrayStatus } from './tray'

// Start built-in mock API server for development/testing
import { startMockServer } from './mock-server'
import { setupIPC } from './ipc-handlers'
import { mockEvents, Alert, getStatus, getActiveAlertCount } from './mock-data'
import { NotificationManager } from './notifications'
import { getStore } from './store'

// Important: Set AppUserModelId BEFORE app is ready for Windows notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('com.electron.app')
}

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'DevOps Monitor',
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../../resources/icon.ico'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// Ensure we can actually quit
let isQuitting = false
app.on('before-quit', () => {
  isQuitting = true
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => {
    // Ping response is silent
  })

  // start the mock backend before opening the window
  startMockServer()
  // Create the main window
  const mainWindow = createWindow()
  // Setup IPC handlers
  setupIPC(mainWindow)
  // Create Tray
  createTray(mainWindow)

  // Function to sync tray state from mock data
  const syncTray = () => {
    const status = getStatus()
    const activeAlerts = getActiveAlertCount()
    const tooltip = `DevOps Monitor | ${status.healthy}/${status.total} healthy`
    updateTrayStatus(status.overall, mainWindow, tooltip, activeAlerts)
  }

  // Periodic sync every 10 seconds
  const traySyncInterval = setInterval(syncTray, 10000)

  // Listen for new alerts from mock data and trigger system notifications
  mockEvents.on('new-alert', async (alert: Alert) => {
    const store = await getStore()
    const settings = store.get('settings')
    
    const notificationsEnabled = settings?.notificationsEnabled ?? true
    const notificationThreshold = settings?.notificationThreshold ?? 'all'

    if (!notificationsEnabled || notificationThreshold === 'off') {
      return
    }

    // Direct check for 'all' to ensure it always works
    let shouldNotify = false
    if (notificationThreshold === 'all') {
      shouldNotify = true
    } else {
      const severityMap: Record<string, number> = { 
        'info': 0, 
        'warning': 1, 
        'critical': 2
      }
      const thresholdValue = severityMap[notificationThreshold] ?? 1
      const alertValue = severityMap[alert.severity] ?? 0
      shouldNotify = alertValue >= thresholdValue
    }

    if (shouldNotify) {
      const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'
      NotificationManager.send(
        `${emoji} Alert: ${alert.serviceName}`,
        alert.message,
        mainWindow
      )
    }
    
    mainWindow.webContents.send('alert-received', alert)
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    destroyTray()
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
