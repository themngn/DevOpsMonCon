import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getApiPort: () => number
      storeGet: (key: string) => Promise<any>
      storeSet: (key: string, value: any) => Promise<void>
    }
  }
}