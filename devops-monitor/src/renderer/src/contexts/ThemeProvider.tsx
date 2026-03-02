import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load theme from store on mount
    window.api.storeGet('theme').then((savedTheme) => {
      if (savedTheme) setTheme(savedTheme)
      setMounted(true)
    }).catch(console.error)
  }, [])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    window.api.storeSet('theme', newTheme).catch(console.error)
    applyTheme(newTheme)
  }

  useEffect(() => {
    if (mounted) {
      applyTheme(theme)
    }
  }, [theme, mounted])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
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

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
