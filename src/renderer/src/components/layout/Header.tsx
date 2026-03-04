import { useLocation } from 'react-router-dom'
import { RefreshCw, Moon, Sun, Monitor } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'
import { useTheme } from '../../contexts/ThemeProvider'
import { useRefresh } from '../../contexts/RefreshProvider'
import { useRelativeTime } from '../../hooks/useRelativeTime'
import { Switch } from '../ui/Switch'
import { Label } from '../ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/Select'
import { Button } from '../ui/Button'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip'

const REFRESH_OPTIONS = [5000, 10000, 15000, 30000, 60000, 120000] as const

export default function Header() {
  const location = useLocation()
  const { autoRefresh, pollingInterval, updateSettings } = useSettings()
  const { theme, cycleTheme } = useTheme()
  const { triggerRefresh, lastUpdated } = useRefresh()
  const relativeLastUpdated = useRelativeTime(lastUpdated)

  const getPageTitle = () => {
    if (location.pathname.startsWith('/services/')) {
      return 'Service Overview'
    }

    switch (location.pathname) {
      case '/':
        return 'System Dashboard'
      case '/alerts':
        return 'New Alerts'
      case '/logs':
        return 'System Logs'
      case '/settings':
        return 'App Settings'
      default:
        return 'Monitoring Console'
    }
  }

  const ThemeIcon = {
    dark: Moon,
    light: Sun,
    system: Monitor
  }[theme]

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold truncate">{getPageTitle()}</h1>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground tabular-nums ml-4">
            Updated {relativeLastUpdated}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Auto Refresh Toggle */}
        <div className="flex items-center gap-2 pr-4 border-r">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={(v) => updateSettings({ autoRefresh: v })}
            className="scale-75"
          />
          <Label 
            htmlFor="auto-refresh" 
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            Auto
          </Label>
        </div>

        {/* Polling Interval Select */}
        <Select
          value={String(pollingInterval)}
          onValueChange={(v) => updateSettings({ pollingInterval: Number(v) })}
        >
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REFRESH_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)}>
                {opt >= 60000 ? `${opt / 60000}m` : `${opt / 1000}s`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Manual Refresh */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => triggerRefresh()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh now</p>
          </TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={cycleTheme}
            >
              <ThemeIcon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Theme: {theme} (click to cycle)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
