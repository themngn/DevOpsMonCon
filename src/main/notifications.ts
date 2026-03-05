import { Notification, BrowserWindow, nativeImage } from 'electron'
import path from 'path'

let lastNotificationTime: number = 0
const THROTTLE_MS = 100

export const NotificationManager = {
  send: (title: string, body: string, mainWindow: BrowserWindow) => {
    const now = Date.now()

    if (now - lastNotificationTime < THROTTLE_MS) return
    lastNotificationTime = now

    const iconPath = path.join(__dirname, '../../resources/icon.png')
    const notification = new Notification({ 
      title, 
      body,
      icon: nativeImage.createFromPath(iconPath)
    })

    notification.on('click', () => {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('navigate', '/alerts')
    })

    notification.show()
  }
}
