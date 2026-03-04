import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bell,
  FileText,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useServer } from '../../contexts/ServerProvider'
import { useAlertCount } from '../../hooks/useAlertCount'
import { storage } from '../../utils/storage'
import { Button } from '../ui/Button'
import { Separator } from '../ui/Separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip'
import { ConfirmDialog } from '../shared/ConfirmDialog'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => storage.get('sidebarCollapsed', false))
  const { activeServer, disconnect } = useServer()
  const alertCount = useAlertCount()
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false)

  useEffect(() => {
    storage.set('sidebarCollapsed', collapsed)
  }, [collapsed])

  const NavItem = ({ to, icon: Icon, label, badge }: any) => {
    const link = (
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
            isActive 
              ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
              : 'hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground',
            collapsed && 'justify-center px-2'
          )
        }
      >
        <div className="relative shrink-0">
          <Icon className="w-5 h-5" />
          {badge > 0 && (
            <span className={cn(
              "absolute flex items-center justify-center rounded-full bg-destructive text-white font-bold",
              collapsed 
                ? "-top-1 -right-1 h-3.5 min-w-[14px] text-[8px] px-0.5" 
                : "-top-1.5 -right-1.5 h-4 min-w-[16px] text-[10px] px-1"
            )}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </div>
        {!collapsed && <span className="text-sm font-medium flex-1 truncate">{label}</span>}
      </NavLink>
    )

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">{link}</div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}{badge > 0 ? ` (${badge})` : ''}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return link
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4 border-b shrink-0">
        <Activity className="h-6 w-6 shrink-0 text-sidebar-primary" />
        {!collapsed && (
          <span className="font-bold text-sm whitespace-nowrap overflow-hidden">DevOps Monitor</span>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/alerts" icon={Bell} label="Alerts" badge={alertCount} />
        <NavItem to="/logs" icon={FileText} label="Logs" />
        <NavItem to="/audit-log" icon={Shield} label="Audit Log" />

        <div className="py-2">
          <Separator className="bg-sidebar-border" />
        </div>

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDisconnectDialogOpen(true)}
              >
                <LogOut className="w-5 h-5 shrink-0" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Disconnect from server</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDisconnectDialogOpen(true)}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Disconnect</span>
          </Button>
        )}
      </nav>

      <div className="mt-auto border-t bg-sidebar-accent/10">
        {!collapsed && activeServer && (
          <div className="p-3">
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 truncate">Active Server</p>
              <p className="text-xs font-medium truncate mt-0.5">{activeServer.name || activeServer.url}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-10 justify-center rounded-none border-t"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </div>
          )}
        </Button>
      </div>

      <ConfirmDialog
        open={disconnectDialogOpen}
        onOpenChange={setDisconnectDialogOpen}
        title="Disconnect from Server"
        description={`Are you sure you want to disconnect from "${activeServer?.name || activeServer?.url || 'this server'}"?`}
        confirmLabel="Disconnect"
        variant="destructive"
        onConfirm={disconnect}
      />
    </aside>
  )
}
