import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Bell,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Server
} from 'lucide-react'
import { cn } from '../../utils'
import { useServer } from '../../contexts/ServerProvider'
import { useAlertCount } from '../../hooks/useAlertCount'
import { storage } from '../../utils/storage'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => storage.get('sidebarCollapsed', false))
  const { activeServer, disconnect } = useServer()
  const alertCount = useAlertCount()

  useEffect(() => {
    storage.set('sidebarCollapsed', collapsed)
  }, [collapsed])

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect?')) {
      disconnect()
    }
  }

  const NavItem = ({ to, icon: Icon, label, badge }: any) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground',
          collapsed && 'justify-center px-2'
        )
      }
      title={collapsed ? label : undefined}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center justify-between px-3 border-b">
        {!collapsed && <span className="font-bold truncate">DevOps Monitor</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-muted rounded-md ml-auto"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/alerts" icon={Bell} label="Alerts" badge={alertCount} />
        <NavItem to="/logs" icon={FileText} label="Logs" />

        <div className="my-2 border-t" />

        <button
          onClick={handleDisconnect}
          className={cn(
            'flex w-full items-center gap-3 px-3 py-2 rounded-md text-red-500 hover:bg-red-50 transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title="Disconnect"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Disconnect</span>}
        </button>
      </nav>

      {!collapsed && activeServer && (
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Server className="w-4 h-4 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{activeServer.name}</p>
              <p className="text-xs text-muted-foreground truncate">{activeServer.url}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}