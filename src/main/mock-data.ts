// Mock data generator and in-memory store for the built‑in API server.

// re-declare a minimal subset of the shared types here so the main
// process doesn't have to depend on the renderer build.  We intentionally
// keep them in sync with the definitions in the renderer side.

export type ServiceStatus = 'healthy' | 'degraded' | 'critical' | 'down'
export interface Service {
  id: string
  name: string
  status: ServiceStatus
  uptime: number
  cpu: number
  ram: number
  disk: number
  iops: number
  ip: string
  port: number
  version: string
}

export interface MetricPoint {
  timestamp: number
  cpu: number
  ram: number
  disk: number
  iops: number
}

export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertStatus = 'active' | 'acknowledged'
export interface Alert {
  id: string
  serviceId: string
  serviceName: string
  severity: AlertSeverity
  message: string
  timestamp: number
  status: AlertStatus
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR'
export interface LogEntry {
  id: string
  serviceId: string
  serviceName: string
  level: LogLevel
  message: string
  timestamp: number
}

export interface MetricThreshold {
  warning: number
  critical: number
  notify: boolean
}

export interface ServiceAlertSettings {
  cpu: MetricThreshold
  ram: MetricThreshold
  disk: MetricThreshold
  iops: MetricThreshold
}

// ---------- helpers --------------------------------------------------------
function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function uuid() {
  // use crypto if available, otherwise fallback
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

// ---------- state ----------------------------------------------------------
export interface MockState {
  services: Service[]
  metrics: Record<string, MetricPoint[]>
  logs: LogEntry[]
  alerts: Alert[]
  alertSettings: Record<string, ServiceAlertSettings>
}

const state: MockState = {
  services: [],
  metrics: {},
  logs: [],
  alerts: [],
  alertSettings: {}
}

// ---------- initialization --------------------------------------------------
export function initMockData() {
  if (state.services.length) return // already initialized

  const serviceNames = [
    'api-gateway',
    'auth-service',
    'payment-processor',
    'user-service',
    'notification-service',
    'cache-service',
    'db-postgres',
    'db-redis',
    'queue-worker',
    'file-storage',
    'metrics-collector',
    'load-balancer'
  ]

  const now = Date.now()

  serviceNames.forEach((name) => {
    const id = uuid()
    const status: Service['status'] = randomChoice([
      'healthy',
      'healthy',
      'healthy',
      'degraded',
      'critical',
      'down'
    ])
    state.services.push({
      id,
      name,
      status,
      uptime: randomBetween(0, 10 * 3600),
      cpu: randomBetween(1, 50),
      ram: randomBetween(1, 50),
      disk: randomBetween(1, 50),
      iops: randomBetween(100, 1000),
      ip: '127.0.0.1',
      port: 8000 + Math.floor(Math.random() * 1000),
      version: `1.0.${Math.floor(Math.random() * 10)}`
    })

    // Generate historical metric points covering the last 30 days
    // with 7.2-hour intervals = ~100 points for 30 days
    const seriesNow = Date.now()
    const points: MetricPoint[] = []
    const thirtyDaysAgo = seriesNow - 30 * 24 * 60 * 60 * 1000

    for (let time = thirtyDaysAgo; time <= seriesNow; time += 7.2 * 60 * 60_000) {
      points.push({
        timestamp: time,
        cpu: randomBetween(1, 50),
        ram: randomBetween(1, 50),
        disk: randomBetween(1, 50),
        iops: randomBetween(100, 1000)
      })
    }
    state.metrics[id] = points

    // default alert settings
    state.alertSettings[id] = {
      cpu: { warning: 70, critical: 90, notify: true },
      ram: { warning: 70, critical: 90, notify: true },
      disk: { warning: 70, critical: 90, notify: true },
      iops: { warning: 500, critical: 800, notify: true }
    }
  })

  // initial logs
  for (let i = 0; i < 200; i++) {
    const service = randomChoice(state.services)
    const rnd = Math.random()
    const level: LogEntry['level'] = rnd < 0.6 ? 'INFO' : rnd < 0.9 ? 'WARN' : 'ERROR'
    state.logs.push({
      id: uuid(),
      serviceId: service.id,
      serviceName: service.name,
      level,
      message: `Initial log message (${level})`,
      timestamp: now - Math.floor(Math.random() * 59 * 60_000)
    })
  }

  // initial alerts
  for (let i = 0; i < 15; i++) {
    const service = randomChoice(state.services)
    const severity: Alert['severity'] = randomChoice(['critical', 'warning', 'info'])
    state.alerts.push({
      id: uuid(),
      serviceId: service.id,
      serviceName: service.name,
      severity,
      message: `Initial ${severity} alert`,
      timestamp: now - Math.floor(Math.random() * 59 * 60_000),
      status: Math.random() < 0.4 ? 'acknowledged' : 'active'
    })
  }
}

// ---------- ticking logic --------------------------------------------------

enum TickLimits {
  MAX_METRICS = 60,
  MAX_LOGS = 2000,
  MAX_ALERTS = 500
}

function drift(value: number) {
  const factor = randomBetween(0.95, 1.05)
  return value * factor
}

function tick() {
  const now = Date.now()

  // metrics drift
  state.services.forEach((svc) => {
    const arr = state.metrics[svc.id]
    if (!arr) return
    const last = arr[arr.length - 1]
    const next: MetricPoint = {
      timestamp: now,
      cpu: drift(last.cpu),
      ram: drift(last.ram),
      disk: drift(last.disk),
      iops: drift(last.iops)
    }
    arr.push(next)
    if (arr.length > TickLimits.MAX_METRICS) arr.shift()
  })

  // new logs
  const newLogCount = Math.floor(randomBetween(2, 4))
  for (let i = 0; i < newLogCount; i++) {
    const service = randomChoice(state.services)
    const rnd = Math.random()
    const level: LogEntry['level'] = rnd < 0.6 ? 'INFO' : rnd < 0.9 ? 'WARN' : 'ERROR'
    state.logs.push({
      id: uuid(),
      serviceId: service.id,
      serviceName: service.name,
      level,
      message: `Automated ${level} log`,
      timestamp: now
    })
    if (state.logs.length > TickLimits.MAX_LOGS) state.logs.shift()
  }

  // possible new alert
  if (Math.random() < 0.1) {
    const service = randomChoice(state.services)
    const severity: Alert['severity'] = randomChoice(['critical', 'warning', 'info'])
    state.alerts.push({
      id: uuid(),
      serviceId: service.id,
      serviceName: service.name,
      severity,
      message: `Automated ${severity} alert`,
      timestamp: now,
      status: 'active'
    })
    if (state.alerts.length > TickLimits.MAX_ALERTS) state.alerts.shift()
  }
}

let ticker: NodeJS.Timeout | null = null

export function startTicker() {
  if (ticker) return
  ticker = setInterval(tick, 5000)
}

export function stopTicker() {
  if (ticker) clearInterval(ticker)
  ticker = null
}

// ---------- query helpers --------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getServices(_periodMinutes?: number): Service[] {
  // the `period` argument is not used at the moment; we simply expose all
  // services. it exists only to satisfy the shape of the public API.
  return [...state.services]
}

export function getService(id: string): Service | undefined {
  return state.services.find((s) => s.id === id)
}

export function getMetrics(_id: string, rangeSec?: number): MetricPoint[] {
  const now = Date.now()

  // Always generate fresh data for the requested range to ensure proper time spans
  if (!rangeSec) {
    rangeSec = 30 * 60 // Default to 30 minutes
  }

  const startTime = now - rangeSec * 1000
  const maxPoints = 100

  // Generate exactly maxPoints data points evenly distributed across the time range
  const points: MetricPoint[] = []
  for (let i = 0; i < maxPoints; i++) {
    // Linear interpolation from startTime to now
    const timestamp = startTime + (i / (maxPoints - 1)) * (now - startTime)
    points.push({
      timestamp: Math.round(timestamp),
      cpu: randomBetween(1, 50),
      ram: randomBetween(1, 50),
      disk: randomBetween(1, 50),
      iops: randomBetween(100, 1000)
    })
  }

  return points
}

interface PaginationParams {
  page?: number
  limit?: number
}

function paginate<T>(
  items: T[],
  page = 1,
  limit = 20
): { items: T[]; total: number; page: number; limit: number } {
  const total = items.length
  const start = (page - 1) * limit
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit
  }
}

export function queryLogs(
  opts: {
    serviceId?: string
    level?: string
    search?: string
    timeRange?: number
  } & PaginationParams
) {
  let items = state.logs
  if (opts.serviceId) {
    items = items.filter((l) => l.serviceId === opts.serviceId)
  }
  if (opts.level) {
    items = items.filter((l) => l.level === opts.level)
  }
  if (opts.search) {
    items = items.filter((l) => l.message.toLowerCase().includes(opts.search!.toLowerCase()))
  }
  if (opts.timeRange) {
    const cutoff = Date.now() - opts.timeRange
    items = items.filter((l) => {
      const ts = typeof l.timestamp === 'number' ? l.timestamp : new Date(l.timestamp).getTime()
      return ts >= cutoff
    })
  }
  return paginate(items, opts.page, opts.limit)
}

export function queryAlerts(
  opts: {
    severity?: string
    status?: string
    timeRange?: number
  } & PaginationParams
) {
  let items = state.alerts
  if (opts.severity) {
    items = items.filter((a) => a.severity === opts.severity)
  }
  if (opts.status) {
    items = items.filter((a) => a.status === opts.status)
  }
  if (opts.timeRange) {
    const cutoff = Date.now() - opts.timeRange
    items = items.filter((a) => {
      const ts = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime()
      return ts >= cutoff
    })
  }
  return paginate(items, opts.page, opts.limit)
}

export function acknowledgeAlert(id: string) {
  const a = state.alerts.find((x) => x.id === id)
  if (a) a.status = 'acknowledged'
  return a
}

export function getActiveAlertCount() {
  return state.alerts.filter((a) => a.status === 'active').length
}

export function getStatus() {
  const counts: Record<string, number> = {
    healthy: 0,
    degraded: 0,
    critical: 0,
    down: 0
  }
  state.services.forEach((s) => (counts[s.status] = (counts[s.status] || 0) + 1))
  return {
    overall: 'ok',
    healthy: counts.healthy,
    degraded: counts.degraded,
    critical: counts.critical,
    down: counts.down,
    total: state.services.length,
    activeAlerts: getActiveAlertCount()
  }
}

export function getAlertSettings(serviceId: string) {
  return state.alertSettings[serviceId]
}

export function updateAlertSettings(serviceId: string, settings: ServiceAlertSettings) {
  state.alertSettings[serviceId] = settings
  return settings
}

export function restartService(id: string) {
  const s = getService(id)
  if (!s) return Promise.reject(new Error('not found'))
  return new Promise<void>((resolve) => {
    setTimeout(
      () => {
        s.status = 'healthy'
        resolve()
      },
      randomBetween(2000, 4000)
    )
  })
}

export function drainService(id: string) {
  const s = getService(id)
  if (!s) return Promise.reject(new Error('not found'))
  return new Promise<void>((resolve) => {
    setTimeout(
      () => {
        s.status = 'degraded'
        resolve()
      },
      randomBetween(3000, 6000)
    )
  })
}

export { state }
