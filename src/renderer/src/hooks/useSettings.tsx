// Re-export the context hook as the canonical useSettings hook.
// All settings state lives in SettingsProvider — one source of truth.
export { useSettingsContext as useSettings } from '../contexts/SettingsProvider'
