import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeProvider'
import { SettingsProvider } from './contexts/SettingsProvider'
import { ServerProvider } from './contexts/ServerProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SettingsProvider>
        <ServerProvider>
          <App />
        </ServerProvider>
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>
)
