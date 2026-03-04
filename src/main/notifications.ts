import { Notification, BrowserWindow } from 'electron'

let lastNotificationTime: number = 0
const THROTTLE_MS = 10000

export const NotificationManager = {
  send: (title: string, body: string, mainWindow: BrowserWindow) => {
    const now = Date.now()

    if (now - lastNotificationTime < THROTTLE_MS) return
    lastNotificationTime = now

    const notification = new Notification({ title, body })
    notification.on('click', () => {
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('navigate', '/alerts')
    })

    notification.show()
  }
}
