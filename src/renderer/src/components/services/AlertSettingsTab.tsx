import { useState, useEffect } from 'react'
import { getAlertSettings, updateAlertSettings } from '../../services/api'
import type { ServiceAlertSettings, MetricThreshold } from '../../types/index'
import { Switch } from '../ui/Switch'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Button } from '../ui/Button'

export function AlertSettingsTab({ serviceId }: { serviceId: string }) {
    const [settings, setSettings] = useState<ServiceAlertSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
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
        return () => { active = false }
    }, [serviceId])

    const handleChange = (metric: keyof ServiceAlertSettings & string, field: keyof MetricThreshold & string, value: any) => {
        if (!settings) return
        setSettings((prev) => {
            if (!prev) return prev
            return {
                ...prev,
                [metric]: {
                    ...prev[metric],
                    [field]: value
                }
            }
        })

        // Validation
        setErrors((prev) => {
            const newErrs = { ...prev }
            const newSettings = {
                ...settings,
                [metric]: {
                    ...settings[metric],
                    [field]: value
                }
            }
            const warn = newSettings[metric].warning
            const crit = newSettings[metric].critical
            if (crit < warn) {
                newErrs[metric] = 'Critical must be ≥ warning'
            } else {
                delete newErrs[metric]
            }
            return newErrs
        })
    }

    const handleSave = async () => {
        if (!settings) return
        if (Object.keys(errors).length > 0) return

        setSaving(true)
        setSaveMessage(null)
        try {
            await updateAlertSettings(serviceId, settings)
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

    const metrics: { key: keyof ServiceAlertSettings & string, label: string }[] = [
        { key: 'cpu', label: 'CPU Usage (%)' },
        { key: 'ram', label: 'RAM Usage (%)' },
        { key: 'disk', label: 'Disk Usage (%)' },
        { key: 'iops', label: 'Disk IOPs' }
    ]

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="space-y-6 flex-1 min-h-0 overflow-y-auto">
                {metrics.map(({ key, label }) => (
                    <div key={key} className="border rounded-lg p-4 bg-background shadow-sm space-y-4">
                        <h3 className="font-semibold">{label}</h3>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="space-y-2">
                                <Label htmlFor={`${key}-warning`}>Warning Threshold</Label>
                                <Input
                                    id={`${key}-warning`}
                                    type="number"
                                    value={settings[key].warning}
                                    onChange={(e) => handleChange(key, 'warning', Number(e.target.value))}
                                    className="w-32"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`${key}-critical`}>Critical Threshold</Label>
                                <Input
                                    id={`${key}-critical`}
                                    type="number"
                                    value={settings[key].critical}
                                    onChange={(e) => handleChange(key, 'critical', Number(e.target.value))}
                                    className="w-32"
                                />
                            </div>

                            <div className="space-y-2 flex flex-col justify-end h-[68px]">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id={`${key}-notify`}
                                        checked={settings[key].notify}
                                        onCheckedChange={(c) => handleChange(key, 'notify', c)}
                                    />
                                    <Label htmlFor={`${key}-notify`}>Notify</Label>
                                </div>
                            </div>
                        </div>

                        {errors[key] && (
                            <p className="text-sm border rounded bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-2">
                                {errors[key]}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
                <div className="flex-1">
                    {saveMessage && (
                        <span className={`text-sm ${saveMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                            {saveMessage.text}
                        </span>
                    )}
                </div>
                <Button onClick={handleSave} disabled={saving || Object.keys(errors).length > 0}>
                    {saving && <div className="w-4 h-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </div>
    )
}
