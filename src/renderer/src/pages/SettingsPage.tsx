import { useSettings } from '../hooks/useSettings'
import { Switch } from '../components/ui/Switch'
import { Label } from '../components/ui/Label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Bell, BellRing, ShieldAlert, Info, Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  const { 
    notificationsEnabled, 
    notificationThreshold, 
    updateSettings 
  } = useSettings()

  const handleTestNotification = () => {
    window.api?.sendTestNotification()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your application preferences and notification rules
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notifications Section */}
        <section className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b bg-muted/30 flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">System Notifications</h2>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-toggle" className="text-base">Enable Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive desktop notifications when a service status changes
                </p>
              </div>
              <Switch 
                id="notifications-toggle"
                checked={notificationsEnabled}
                onCheckedChange={(checked) => updateSettings({ notificationsEnabled: checked })}
              />
            </div>

            <div className="h-px bg-border" />

            {/* Severity Threshold */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label className="text-base">Notification Threshold</Label>
                <p className="text-sm text-muted-foreground">
                  Minimum severity required to trigger an OS notification
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Select
                  disabled={!notificationsEnabled}
                  value={notificationThreshold}
                  onValueChange={(v) => updateSettings({ notificationThreshold: v as any })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <span>All (Info +)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="warning">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                        <span>Warning +</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-red-500" />
                        <span>Critical only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="off">
                      <span>Muted</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Test Button */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Test Configuration</Label>
                <p className="text-sm text-muted-foreground">
                  Send a test notification to verify your OS settings
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleTestNotification}
                disabled={!notificationsEnabled || notificationThreshold === 'off'}
              >
                Send Test Notification
              </Button>
            </div>
          </div>
        </section>

        {/* App Info Section */}
        <section className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b bg-muted/30 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Application Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-muted-foreground">Version</div>
              <div className="font-medium">1.0.0 (Production)</div>
              
              <div className="text-muted-foreground">Environment</div>
              <div className="font-medium">Electron v39.2.6 / React 19</div>
              
              <div className="text-muted-foreground">Status</div>
              <div className="flex items-center gap-2 text-emerald-500">
                <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                <span className="font-medium">Connected to Mock Server</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
