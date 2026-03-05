import { ElectronAPI } from '@electron-toolkit/preload'
import type { AppSettings } from '../renderer/src/types'

export interface RendererAPI {
  getApiPort(): Promise<number>
  storeGet(key: string): Promise<any>
  storeSet(key: string, value: any): Promise<boolean>
  getSettings(): Promise<AppSettings>
  saveSettings(settings: AppSettings): Promise<boolean>
  directSyncSettings(settings: AppSettings): void
  updateTrayStatus(status: string, tooltip: string, alertsCount: number): void
  sendNotification(title: string, body: string): void
  onAlertReceived(callback: (alert: any) => void): () => void
  onNavigate(callback: (route: string) => void): () => void
}

declare global {
  interface Window {
    electron: any
    api: RendererAPI
  }
}
