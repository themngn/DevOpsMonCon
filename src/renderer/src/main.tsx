import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './contexts/ThemeProvider'
import { SettingsProvider } from './contexts/SettingsProvider'
import { ServerProvider } from './contexts/ServerProvider'
import { TooltipProvider } from './components/ui/Tooltip'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <SettingsProvider>
          <ServerProvider>
            <App />
          </ServerProvider>
        </SettingsProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
