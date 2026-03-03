import { useLocation } from 'react-router-dom'
import { RefreshCw, Moon, Sun, Monitor } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'
import { useTheme } from '../../contexts/ThemeProvider'

export default function Header() {
  const location = useLocation()
  const { autoRefresh, pollingInterval, updateSettings } = useSettings()
  const { theme, cycleTheme } = useTheme()

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard'
      case '/alerts': return 'Alerts'
      case '/logs': return 'Logs'
      case '/settings': return 'Settings'
      default: return 'DevOps Monitor'
    }
  }

  const ThemeIcon = {
    dark: Moon,
    light: Sun,
    system: Monitor
  }[theme]

  return (
    <header className="grid h-14 grid-cols-3 items-center border-b bg-card px-4">
      <div className="flex justify-start min-w-0">
        <h1 className="text-lg font-semibold truncate">{getPageTitle()}</h1>
      </div>
      <div />

      <div className="flex items-center justify-end gap-4 shrink-0">
        {/* Auto Refresh Controls */}
        <div className="flex items-center gap-2 border-r pr-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => updateSettings({ autoRefresh: e.target.checked })}
              className="rounded border-gray-300"
            />
            <span>Auto</span>
          </label>

          <select
            value={pollingInterval}
            onChange={(e) => updateSettings({ pollingInterval: Number(e.target.value) })}
            className="h-8 rounded-md border bg-background px-2 text-sm text-foreground"
            style={{ colorScheme: theme === 'system' ? 'light dark' : theme }}
            disabled={!autoRefresh}
          >
            <option className="bg-background text-foreground" value={5000}>5s</option>
            <option className="bg-background text-foreground" value={10000}>10s</option>
            <option className="bg-background text-foreground" value={15000}>15s</option>
            <option className="bg-background text-foreground" value={30000}>30s</option>
            <option className="bg-background text-foreground" value={60000}>1m</option>
            <option className="bg-background text-foreground" value={120000}>2m</option>
          </select>
        </div>

        {/* Status & Manual Refresh */}
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-muted rounded-full transition-colors"
            title="Refresh now"
            onClick={() => window.location.reload()} // Placeholder for real refresh
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}