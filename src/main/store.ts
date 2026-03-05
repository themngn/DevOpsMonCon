import type { AppSettings, ServerEntry } from '../renderer/src/types'

export interface StoreSchema {
  settings: AppSettings
  theme: 'light' | 'dark' | 'system'
  servers: ServerEntry[]
  sidebarCollapsed: boolean
}

let storeInstance: any = null

async function getStore() {
  if (!storeInstance) {
    const StoreModule = await import('electron-store')
    const Store = StoreModule.default

    storeInstance = new Store<StoreSchema>({
      defaults: {
        settings: {
          pollingInterval: 15000,
          autoRefresh: true,
          notificationsEnabled: true,
          notificationThreshold: 'all'
        },
        theme: 'system',
        servers: [],
        sidebarCollapsed: false
      }
    })
  }
  return storeInstance
}

export { getStore }
export default getStore
