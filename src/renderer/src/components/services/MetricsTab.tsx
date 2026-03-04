import { useState, useEffect, useCallback } from 'react'
import { getMetrics } from '../../services/api'
import type { MetricPoint } from '../../types/index'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Input } from '../ui/Input'
import { Dropdown } from '../ui/Dropdown'
import { useSettings } from '../../hooks/useSettings'
import { usePolling } from '../../hooks/usePolling'

const UNITS = [
  { label: 'Seconds', value: '1' },
  { label: 'Minutes', value: '60' },
  { label: 'Hours', value: '3600' },
  { label: 'Days', value: '86400' },
  { label: 'Weeks', value: '604800' }
]

// Helper function to format timestamps based on actual data span
function getTimeFormatter(data: MetricPoint[]) {
  if (data.length < 2) {
    return (timestamp: number) => {
      const d = new Date(timestamp)
      const h = d.getHours().toString().padStart(2, '0')
      const m = d.getMinutes().toString().padStart(2, '0')
      const s = d.getSeconds().toString().padStart(2, '0')
      return `${h}:${m}:${s}`
    }
  }

  // Calculate actual data span
  const timestamps = data.map((p) =>
    typeof p.timestamp === 'number' ? p.timestamp : new Date(p.timestamp).getTime()
  )
  const minTime = Math.min(...timestamps)
  const maxTime = Math.max(...timestamps)
  const actualSpanMs = maxTime - minTime

  return (timestamp: number) => {
    const d = new Date(timestamp)
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    const s = d.getSeconds().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')

    // Up to 2 minutes: show HH:MM:SS
    if (actualSpanMs <= 120_000) return `${h}:${m}:${s}`

    // 2 minutes to 6 hours: show HH:MM
    if (actualSpanMs <= 21_600_000) return `${h}:${m}`

    // 6 hours to 7 days: show MM/DD HH:MM
    if (actualSpanMs <= 604_800_000) return `${month}/${day} ${h}:${m}`

    // More than 7 days: show MM/DD
    return `${month}/${day}`
  }
}

export function MetricsTab({ serviceId }: { serviceId: string }) {
  const [rangeVal, setRangeVal] = useState('30')
  const [unit, setUnit] = useState('1')
  const [metrics, setMetrics] = useState<MetricPoint[]>([])
  const [loading, setLoading] = useState(true)
  const { pollingInterval, autoRefresh } = useSettings()

  const fetchData = useCallback(async () => {
    const valNum = parseInt(rangeVal)
    const unitNum = parseInt(unit)
    const seconds = (isNaN(valNum) ? 30 : valNum) * (isNaN(unitNum) ? 1 : unitNum)
    try {
      const data = await getMetrics(serviceId, seconds)
      setMetrics(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [serviceId, rangeVal, unit])

  // Fetch immediately when range or service changes
  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [fetchData])

  // Background refresh on polling interval
  usePolling(fetchData, pollingInterval, { enabled: autoRefresh })

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Time frame:</span>
        <Input
          type="number"
          min="1"
          max="9999"
          value={rangeVal}
          onChange={(e) => setRangeVal(e.target.value)}
          className="w-24"
        />
        <Dropdown options={UNITS} value={unit} onChange={setUnit} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 overflow-y-auto">
        <ChartCard
          title="CPU Usage (%)"
          data={metrics}
          dataKey="cpu"
          color="#3b82f6"
          loading={loading}
          domain={[0, 100]}
        />
        <ChartCard
          title="RAM Usage (%)"
          data={metrics}
          dataKey="ram"
          color="#a855f7"
          loading={loading}
          domain={[0, 100]}
        />
        <ChartCard
          title="Disk Usage (%)"
          data={metrics}
          dataKey="disk"
          color="#f97316"
          loading={loading}
          domain={[0, 100]}
        />
        <ChartCard
          title="IOPs"
          data={metrics}
          dataKey="iops"
          color="#22c55e"
          loading={loading}
          domain={['auto', 'auto']}
        />
      </div>
    </div>
  )
}

function ChartCard({
  title,
  data,
  dataKey,
  color,
  loading,
  domain
}: {
  title: string
  data: any[]
  dataKey: string
  color: string
  loading: boolean
  domain: [any, any]
}) {
  const timeFormatter = getTimeFormatter(data)
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-4 bg-background shadow-sm h-64">
      <h3 className="font-semibold text-sm">{title}</h3>
      <div className="flex-1 min-h-0 relative">
        {loading && data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="opacity-10"
              />
              <XAxis
                dataKey="timestamp"
                tickFormatter={timeFormatter}
                className="text-xs text-muted-foreground"
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={domain}
                className="text-xs text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)'
                }}
                labelFormatter={(l) => new Date(l).toLocaleTimeString()}
                formatter={(value) => (typeof value === 'number' ? value.toFixed(2) : value)}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#fill-${dataKey})`}
                animationDuration={500}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
