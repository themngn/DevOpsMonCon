import React, { createContext, useContext, useState, useEffect } from 'react'
import { storage } from '../utils/storage'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
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
        console.log('[Theme] System theme applied:', systemTheme)
      }
      applySystemTheme()
      mediaQuery.addEventListener('change', applySystemTheme)
      return () => mediaQuery.removeEventListener('change', applySystemTheme)
    }

    root.classList.add(theme)
    return undefined
  }, [theme])

  const cycleTheme = () => {
    const modes: Theme[] = ['dark', 'light', 'system']
    const nextIndex = (modes.indexOf(theme) + 1) % modes.length
    const nextTheme = modes[nextIndex]
    setTheme(nextTheme)
    storage.set('theme', nextTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
