import { useState, useEffect } from 'react'
import { getAlertSettings, updateAlertSettings } from '../../services/api'
import type { ServiceAlertSettings, MetricThreshold } from '../../types/index'
import { Switch } from '../ui/Switch'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'

export function AlertSettingsTab({ serviceId }: { serviceId: string }) {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let active = true
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const data = await getAlertSettings(serviceId)
        if (active) setSettings(data)
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchSettings()
    return () => {
      active = false
    }
  }, [serviceId])

  const handleChange = (
    metric: keyof ServiceAlertSettings & string,
    field: keyof MetricThreshold & string,
    value: any
  ) => {
    if (!settings) return
    
    const newSettings = {
      ...settings,
      [metric]: {
        ...settings[metric],
        [field]: value
      }
    }
    
    setSettings(newSettings)

    // Validation
    setErrors((prev) => {
      const newErrs = { ...prev }
      const warn = parseFloat(String(newSettings[metric].warning)) || 0
      const crit = parseFloat(String(newSettings[metric].critical)) || 0
      if (crit < warn) {
        newErrs[metric] = 'Critical must be ≥ warning'
      } else {
        delete newErrs[metric]
      }
      return newErrs
    })
  }

  const handleBlur = (
    metric: keyof ServiceAlertSettings & string,
    field: keyof MetricThreshold & string,
    value: string
  ) => {
    if (value === '') {
      handleChange(metric, field, 0)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    setSaveMessage(null)
    
    // Ensure all values are numbers before saving
    const finalSettings: ServiceAlertSettings = {
      cpu: { ...settings.cpu, warning: Number(settings.cpu.warning), critical: Number(settings.cpu.critical) },
      ram: { ...settings.ram, warning: Number(settings.ram.warning), critical: Number(settings.ram.critical) },
      disk: { ...settings.disk, warning: Number(settings.disk.warning), critical: Number(settings.disk.critical) },
      iops: { ...settings.iops, warning: Number(settings.iops.warning), critical: Number(settings.iops.critical) }
    }

    try {
      await updateAlertSettings(serviceId, finalSettings)
      setSaveMessage({ type: 'success', text: 'Settings saved!' })
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 flex justify-center">Loading settings...</div>
  if (!settings) return <div className="p-8 flex justify-center">Failed to load settings.</div>

  const metrics: { key: keyof ServiceAlertSettings & string; label: string }[] = [
    { key: 'cpu', label: 'CPU Usage (%)' },
    { key: 'ram', label: 'RAM Usage (%)' },
    { key: 'disk', label: 'Disk Usage (%)' },
    { key: 'iops', label: 'Disk IOPs' }
  ]

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto pr-2 content-start">
        {metrics.map(({ key, label }) => (
          <div key={key} className="border rounded-xl p-5 bg-card shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm">{label}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Notify</span>
                <Switch
                  id={`${key}-notify`}
                  checked={settings[key].notify}
                  onCheckedChange={(c) => handleChange(key, 'notify', c)}
                  className="scale-75"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${key}-warning`} className="text-[10px] uppercase font-semibold text-muted-foreground">Warning</Label>
                <Input
                  id={`${key}-warning`}
                  type="number"
                  value={settings[key].warning}
                  onChange={(e) => handleChange(key, 'warning', e.target.value)}
                  onBlur={(e) => handleBlur(key, 'warning', e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${key}-critical`} className="text-[10px] uppercase font-semibold text-destructive">Critical</Label>
                <Input
                  id={`${key}-critical`}
                  type="number"
                  value={settings[key].critical}
                  onChange={(e) => handleChange(key, 'critical', e.target.value)}
                  onBlur={(e) => handleBlur(key, 'critical', e.target.value)}
                  className="h-9 border-destructive/20 focus-visible:ring-destructive"
                />
              </div>
            </div>

            {errors[key] && (
              <div className="mt-auto pt-2">
                <p className="text-[10px] font-medium border border-destructive/20 rounded bg-destructive/5 text-destructive px-2 py-1.5 animate-in fade-in slide-in-from-top-1">
                  {errors[key]}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex-1">
          {saveMessage && (
            <span
              className={`text-sm ${saveMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}
            >
              {saveMessage.text}
            </span>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving || Object.keys(errors).length > 0}>
          {saving && (
            <div className="w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
