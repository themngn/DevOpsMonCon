import { app, Tray, Menu, nativeImage, BrowserWindow } from 'electron'
import path from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow): Tray {
  const iconPath = path.join(__dirname, '../../resources/tray-green.ico')
  tray = new Tray(nativeImage.createFromPath(iconPath))
  tray.setToolTip('DevOpsMonCon')

  updateTrayMenu(mainWindow, 0)

  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  return tray
}

export function updateTrayMenu(mainWindow: BrowserWindow, alertCount: number) {
  if (!tray) return
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Dashboard',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('navigate', '/')
      }
    },
    {
      label: `Alerts (${alertCount})`,
      click: () => {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('navigate', '/alerts')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)
}

export function updateTrayStatus(
  status: 'green' | 'yellow' | 'red',
  mainWindow: BrowserWindow,
  tooltip: string,
  activeAlerts: number
) {
  if (!tray) return
  const iconPath = path.join(__dirname, `../../resources/tray-${status}.ico`)
  tray.setImage(nativeImage.createFromPath(iconPath))
  tray.setToolTip(tooltip)
  updateTrayMenu(mainWindow, activeAlerts)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
