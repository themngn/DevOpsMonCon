import { useEffect, useState } from 'react'
import { storage } from '../utils/storage'

type Theme = 'dark' | 'light' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => storage.get<Theme>('theme', 'system'))

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const applySystemTheme = () => {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        root.classList.remove('light', 'dark')
        root.classList.add(systemTheme)
      }
      applySystemTheme()
      mediaQuery.addEventListener('change', applySystemTheme)
      return () => mediaQuery.removeEventListener('change', applySystemTheme)
    }

    root.classList.add(theme)
  }, [theme])

  const cycleTheme = () => {
    const modes: Theme[] = ['dark', 'light', 'system']
    const nextIndex = (modes.indexOf(theme) + 1) % modes.length
    const nextTheme = modes[nextIndex]
    setTheme(nextTheme)
    storage.set('theme', nextTheme)
  }

  return { theme, cycleTheme }
}