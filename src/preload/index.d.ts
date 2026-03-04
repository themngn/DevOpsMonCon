import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppSettings } from '../renderer/src/types'

export interface RendererAPI {
  // API server
  getApiPort(): Promise<number>

  // Store operations
  storeGet(key: string): Promise<any>
  storeSet(key: string, value: any): Promise<boolean>

  // Settings operations
  getSettings(): Promise<AppSettings>
  saveSettings(settings: AppSettings): Promise<boolean>

  // Tray/Notifications
  updateTrayStatus(status: 'green' | 'yellow' | 'red', tooltip: string, alertsCount: number): Promise<boolean>
  sendNotification(title: string, body: string): Promise<boolean>

  // Event listeners
  onAlertReceived(callback: (alert: any) => void): void
  onNavigate(callback: (route: string) => void): void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: RendererAPI
  }
}
