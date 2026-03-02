// Simple wrapper to abstract persistence.
// In a full Electron app with IPC configured, this could wrap electron-store.

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    const item = localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : defaultValue
  },
  set: <T>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value))
  }
}