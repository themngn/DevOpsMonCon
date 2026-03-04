// Mock data generator and in-memory store for the built‑in API server.
//
// Design goals:
//  • 30 days of historical data with a density gradient (denser near "now")
//  • Metrics stored per-service, drift via a mean-reverting walk
//  • Service cpu/ram/disk/iops always mirror the latest metric point
//  • Service status derived from metrics + thresholds on every tick
//  • Realistic, service-aware log messages
//  • Alerts generated from threshold violations (cause → effect)
//  • timeRange param is seconds; filtering converts to ms internally

export type ServiceStatus = 'healthy' | 'degraded' | 'critical' | 'down' | 'restarting'
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
  downUntil?: number
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

export interface AuditLogEntry {
  id: string
  timestamp: number
  user: string
  action: string
  target: string
  details: string
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
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function uuid(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }
}

// Gaussian noise via Box-Muller transform
function gaussian(mean: number, std: number): number {
  let u = 0,
    v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

// Mean-reverting random walk — pulls toward `mean` with speed `alpha`, adds Gaussian noise
function mrw(value: number, mean: number, alpha: number, noise: number): number {
  return value + alpha * (mean - value) + gaussian(0, noise)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ---------- realistic log messages ----------------------------------------

const LOG_TEMPLATES: Record<LogLevel, string[]> = {
  INFO: [
    'Request handled in {n}ms',
    'Health check passed',
    'Connection pool: {n} active',
    'Processed {n} messages from queue',
    'Cache hit ratio: {r}%',
    'Scheduled task completed in {n}ms',
    'Authentication token refreshed',
    'Config reloaded from disk',
    'Metrics flushed to collector',
    'Database query executed in {n}ms',
    'HTTP 200 GET /api/health',
    'HTTP 200 POST /api/data ({n}ms)',
    'Batch job finished: {n} records processed',
    'Service peer discovered: {ip}',
    'TLS certificate valid for {n} days',
    'Rate limiter: {n} req/s allowed',
    'Circuit breaker: closed (healthy)'
  ],
  WARN: [
    'Response time above threshold: {n}ms',
    'Memory usage at {r}%',
    'Retry attempt {n}/3',
    'Connection pool nearing limit: {n}/{max}',
    'Slow query detected: {n}ms',
    'Cache eviction rate high: {n}/s',
    'Queue depth rising: {n} items',
    'CPU spike detected: {r}%',
    'HTTP 429 Too Many Requests from {ip}',
    'Disk usage approaching limit: {r}%',
    'Downstream latency elevated: {n}ms',
    'Config reload failed, using cached version',
    'GC pause time: {n}ms',
    'Connection timeout, retrying...',
    'Circuit breaker: half-open (testing)',
    'Rate limiter: throttling {n} req/s'
  ],
  ERROR: [
    'Connection refused to downstream service',
    'Out of memory: heap limit reached',
    'Timeout after 30s waiting for response',
    'Database connection pool exhausted',
    'HTTP 500 Internal Server Error',
    'Failed to parse response from {ip}',
    'Authentication failed: invalid token',
    'Panic: nil pointer dereference',
    'Disk write failed: no space left',
    'TLS handshake error',
    'Circuit breaker: open (service unavailable)',
    'Fatal: unable to connect to Redis',
    '[CRITICAL] Segfault at address {hex}',
    'Unexpected EOF reading from socket',
    'HTTP 503 Service Unavailable',
    'Rollback failed: transaction corrupted'
  ]
}

function renderTemplate(template: string): string {
  return template
    .replace(/{n}/g, () => String(Math.floor(randomBetween(1, 999))))
    .replace(/{r}/g, () => randomBetween(50, 99).toFixed(1))
    .replace(/{max}/g, () => String(Math.floor(randomBetween(50, 100))))
    .replace(
      /{ip}/g,
      () =>
        `10.${Math.floor(randomBetween(0, 255))}.${Math.floor(randomBetween(0, 255))}.${Math.floor(randomBetween(1, 254))}`
    )
    .replace(
      /{hex}/g,
      () =>
        '0x' +
        Math.floor(Math.random() * 0xffffffff)
          .toString(16)
          .padStart(8, '0')
    )
}

function makeLogMessage(level: LogLevel): string {
  return renderTemplate(randomChoice(LOG_TEMPLATES[level]))
}

import { EventEmitter } from 'events'

export const mockEvents = new EventEmitter()

// ---------- state ----------------------------------------------------------
export interface MockState {
  services: Service[]
  metrics: Record<string, MetricPoint[]>
  logs: LogEntry[]
  auditLogs: AuditLogEntry[]
  alerts: Alert[]
  alertSettings: Record<string, ServiceAlertSettings>
}

const state: MockState = {
  services: [],
  metrics: {},
  logs: [],
  auditLogs: [],
  alerts: [],
  alertSettings: {}
}

// ---------- limits ---------------------------------------------------------

const MAX_METRIC_POINTS = 12000 // per service — ~30 days at 1 point per ~3.6 min
const MAX_LOGS = 50000
const MAX_ALERTS = 5000
const MAX_AUDIT_LOGS = 10000

// ---------- alert message generator ----------------------------------------

function makeAlertMessage(severity: AlertSeverity, serviceName: string): string {
  const messages: Record<AlertSeverity, string[]> = {
    critical: [
      `${serviceName}: CPU usage exceeded 90% for >5 minutes`,
      `${serviceName}: RAM exhausted — OOM killer invoked`,
      `${serviceName}: Disk full — writes failing`,
      `${serviceName}: Service unreachable (connection refused)`,
      `${serviceName}: IOPS limit hit — I/O saturation`,
      `${serviceName}: Response time >10s — SLA breached`
    ],
    warning: [
      `${serviceName}: CPU above warning threshold`,
      `${serviceName}: RAM usage elevated`,
      `${serviceName}: Disk capacity reaching limit`,
      `${serviceName}: Elevated error rate in last 5 minutes`,
      `${serviceName}: Queue depth growing — consumer lagging`,
      `${serviceName}: P95 latency above 500ms`
    ],
    info: [
      `${serviceName}: Scheduled maintenance window starting`,
      `${serviceName}: Deployment completed successfully`,
      `${serviceName}: Health check recovered after failure`,
      `${serviceName}: Auto-scaling triggered: +1 replica`,
      `${serviceName}: Certificate renewed successfully`
    ]
  }
  return randomChoice(messages[severity])
}

// ---------- status derivation -----------------------------------------------

function deriveStatus(
  cpu: number,
  ram: number,
  disk: number,
  threshold: { warning: number; critical: number }
): ServiceStatus {
  if (cpu >= threshold.critical || ram >= threshold.critical || disk >= 95) return 'critical'
  if (cpu >= threshold.warning || ram >= threshold.warning || disk >= 85) return 'degraded'
  return 'healthy'
}

// ---------- initialization --------------------------------------------------
export function initMockData(): void {
  if (state.services.length) return

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

  serviceNames.forEach((name, idx) => {
    const id = uuid()

    // Characteristic "steady-state" values make each service look distinct
    const baseCpu = randomBetween(10, 65)
    const baseRam = randomBetween(15, 70)
    const baseDisk = randomBetween(20, 75)
    const baseIops = randomBetween(50, 800)

    // Density gradient for historical metrics:
    //   30–8 days ago : 1 point per 2 h
    //    8–2 days ago : 1 point per 30 min
    //    2–0 days ago : 1 point per 5 min
    interface Segment {
      startAge: number
      endAge: number
      intervalMs: number
    }
    const metricSegments: Segment[] = [
      { startAge: 30 * 86400, endAge: 8 * 86400, intervalMs: 2 * 3600 * 1000 },
      { startAge: 8 * 86400, endAge: 2 * 86400, intervalMs: 30 * 60 * 1000 },
      { startAge: 2 * 86400, endAge: 0, intervalMs: 5 * 60 * 1000 }
    ]

    let cpu = baseCpu
    let ram = baseRam
    let disk = baseDisk
    let iops = baseIops
    const points: MetricPoint[] = []

    for (const seg of metricSegments) {
      const segStart = now - seg.startAge * 1000
      const segEnd = now - seg.endAge * 1000
      for (let t = segStart; t <= segEnd; t += seg.intervalMs) {
        cpu = clamp(mrw(cpu, baseCpu, 0.05, 3), 0.5, 99)
        ram = clamp(mrw(ram, baseRam, 0.05, 2), 0.5, 99)
        disk = clamp(mrw(disk, baseDisk, 0.02, 1), 0.5, 99)
        iops = clamp(mrw(iops, baseIops, 0.05, 30), 0, 2000)
        points.push({ timestamp: Math.round(t), cpu, ram, disk, iops })
      }
    }

    state.metrics[id] = points

    const latest = points[points.length - 1] ?? {
      cpu: baseCpu,
      ram: baseRam,
      disk: baseDisk,
      iops: baseIops
    }
    const status = deriveStatus(latest.cpu, latest.ram, latest.disk, { warning: 70, critical: 90 })

    state.services.push({
      id,
      name,
      status,
      uptime: randomBetween(0, 30 * 86400),
      cpu: latest.cpu,
      ram: latest.ram,
      disk: latest.disk,
      iops: latest.iops,
      ip: `10.0.${Math.floor(idx / 4)}.${10 + (idx % 4)}`,
      port: 8000 + idx * 10,
      version: `1.${Math.floor(idx / 4)}.${idx % 4}`
    })

    state.alertSettings[id] = {
      cpu: { warning: 70, critical: 90, notify: true },
      ram: { warning: 70, critical: 90, notify: true },
      disk: { warning: 80, critical: 95, notify: true },
      iops: { warning: 1000, critical: 1500, notify: true }
    }
  })

  // Historical logs — same density gradient
  const logSegments = [
    { startAge: 30 * 86400, endAge: 8 * 86400, intervalMs: 4 * 3600 * 1000 },
    { startAge: 8 * 86400, endAge: 2 * 86400, intervalMs: 10 * 60 * 1000 },
    { startAge: 2 * 86400, endAge: 0, intervalMs: 1 * 60 * 1000 }
  ]

  for (const seg of logSegments) {
    const segStart = now - seg.startAge * 1000
    const segEnd = now - seg.endAge * 1000
    for (let t = segStart; t <= segEnd; t += seg.intervalMs) {
      const count = Math.floor(randomBetween(1, 4))
      for (let c = 0; c < count; c++) {
        const service = randomChoice(state.services)
        const rnd = Math.random()
        const level: LogLevel = rnd < 0.6 ? 'INFO' : rnd < 0.88 ? 'WARN' : 'ERROR'
        const jitter = randomBetween(-seg.intervalMs * 0.4, seg.intervalMs * 0.4)
        state.logs.push({
          id: uuid(),
          serviceId: service.id,
          serviceName: service.name,
          level,
          message: makeLogMessage(level),
          timestamp: Math.round(Math.max(now - 30 * 86400 * 1000, t + jitter))
        })
      }
    }
  }
  state.logs.sort((a, b) => a.timestamp - b.timestamp)

  // Historical alerts — sparser; older ones mostly acknowledged
  const alertSegments = [
    { startAge: 30 * 86400, endAge: 8 * 86400, intervalMs: 24 * 3600 * 1000 },
    { startAge: 8 * 86400, endAge: 2 * 86400, intervalMs: 4 * 3600 * 1000 },
    { startAge: 2 * 86400, endAge: 0, intervalMs: 30 * 60 * 1000 }
  ]

  for (const seg of alertSegments) {
    const segStart = now - seg.startAge * 1000
    const segEnd = now - seg.endAge * 1000
    for (let t = segStart; t <= segEnd; t += seg.intervalMs) {
      if (Math.random() > 0.35) continue
      const service = randomChoice(state.services)
      const severity: AlertSeverity = randomChoice(['critical', 'warning', 'warning', 'info'])
      const ageSec = (now - t) / 1000
      const status: AlertStatus =
        ageSec > 2 * 3600
          ? Math.random() < 0.85
            ? 'acknowledged'
            : 'active'
          : Math.random() < 0.5
            ? 'active'
            : 'acknowledged'
      state.alerts.push({
        id: uuid(),
        serviceId: service.id,
        serviceName: service.name,
        severity,
        message: makeAlertMessage(severity, service.name),
        timestamp: Math.round(t + randomBetween(0, seg.intervalMs * 0.9)),
        status
      })
    }
  }
  state.alerts.sort((a, b) => a.timestamp - b.timestamp)

  // Historical audit logs
  const auditActions = [
    { action: 'SERVICE_RESTART', target: 'Service Control' },
    { action: 'SERVICE_DRAIN', target: 'Service Control' },
    { action: 'SETTINGS_UPDATE', target: 'System Settings' },
    { action: 'ALERT_ACKNOWLEDGE', target: 'Alert Center' },
    { action: 'USER_LOGIN', target: 'Auth' }
  ]
  const users = ['admin@example.com', 'ops-lead@example.com', 'developer-1@example.com']

  for (let i = 0; i < 150; i++) {
    const act = randomChoice(auditActions)
    const service = randomChoice(state.services)
    state.auditLogs.push({
      id: uuid(),
      timestamp: now - randomBetween(0, 30 * 86400 * 1000),
      user: randomChoice(users),
      action: act.action,
      target: act.action.startsWith('SERVICE') ? service.name : act.target,
      details: `User performed ${act.action.toLowerCase().replace('_', ' ')}`
    })
  }
  state.auditLogs.sort((a, b) => a.timestamp - b.timestamp)
}

// ---------- ticking logic --------------------------------------------------

function tick(): void {
  const now = Date.now()

  state.services.forEach((svc) => {
    const arr = state.metrics[svc.id]
    if (!arr || arr.length === 0) return

    const settings = state.alertSettings[svc.id]
    const isPayment = svc.name === 'payment-processor'
    const isMetrics = svc.name === 'metrics-collector'
    
    // Resource usage multipliers
    let cpuMeanMult = 0.55
    let ramMeanMult = 0.55
    let noiseMult = 1.0
    let crashProb = 0.00001 // 0.001% chance per tick

    if (isPayment) {
      cpuMeanMult = 0.75
      ramMeanMult = 0.75
      noiseMult = 2.0
      crashProb = 0.00005 // 0.005% chance per tick
    } else if (isMetrics) {
      cpuMeanMult = 0.85
      ramMeanMult = 0.88
      noiseMult = 3.0
      crashProb = 0.0001 // 0.01% chance per tick
    }

    const cpuMean = (settings?.cpu.warning ?? 70) * cpuMeanMult
    const ramMean = (settings?.ram.warning ?? 70) * ramMeanMult
    const diskMean = (settings?.disk.warning ?? 80) * 0.55
    const iopsMean = (settings?.iops.warning ?? 1000) * 0.4

    const last = arr[arr.length - 1]
    const next: MetricPoint = {
      timestamp: now,
      cpu: clamp(mrw(last.cpu, cpuMean, 0.05, 3 * noiseMult), 0.5, 99),
      ram: clamp(mrw(last.ram, ramMean, 0.05, 2 * noiseMult), 0.5, 99),
      disk: clamp(mrw(last.disk, diskMean, 0.02, 0.8), 0.5, 99),
      iops: clamp(mrw(last.iops, iopsMean, 0.05, 25 * noiseMult), 0, 2000)
    }
    arr.push(next)
    if (arr.length > MAX_METRIC_POINTS) arr.shift()

    // Mirror latest metrics to the service record
    svc.cpu = next.cpu
    svc.ram = next.ram
    svc.disk = next.disk
    svc.iops = next.iops
    svc.uptime += 0.5 // 500ms = 0.5s

    const prevStatus = svc.status

    if (svc.downUntil && now < svc.downUntil) {
      svc.status = 'restarting'
      // When restarting, metrics stay minimal
      const last = arr[arr.length - 1]
      arr.push({
        timestamp: now,
        cpu: clamp(mrw(last.cpu, 0, 0.2, 0.5), 0, 99),
        ram: clamp(mrw(last.ram, 0, 0.2, 0.5), 0, 99),
        disk: last.disk,
        iops: 0
      })
      if (arr.length > MAX_METRIC_POINTS) arr.shift()
      svc.cpu = arr[arr.length - 1].cpu
      svc.ram = arr[arr.length - 1].ram
      svc.disk = arr[arr.length - 1].disk
      svc.iops = 0
    } else if (Math.random() < crashProb) {
      svc.status = 'down'
      svc.downUntil = now + randomBetween(30000, 60000)
    } else {
      // Clear downUntil if it was set but time passed
      if (svc.downUntil) delete svc.downUntil
      
      const cpuThresh = settings?.cpu ?? { warning: 70, critical: 90 }
      const ramThresh = settings?.ram ?? { warning: 70, critical: 90 }
      const diskThresh = settings?.disk ?? { warning: 80, critical: 95 }
      svc.status = deriveStatus(next.cpu, next.ram, next.disk, {
        warning: Math.min(cpuThresh.warning, ramThresh.warning, diskThresh.warning),
        critical: Math.min(cpuThresh.critical, ramThresh.critical, diskThresh.critical)
      })
    }

    // 2–4 logs per tick, weighted by current service health
    const logCount = Math.floor(randomBetween(2, 5))
    for (let i = 0; i < logCount; i++) {
      const rnd = Math.random()
      let level: LogLevel
      if (svc.status === 'critical' || svc.status === 'down') {
        level = rnd < 0.25 ? 'INFO' : rnd < 0.55 ? 'WARN' : 'ERROR'
      } else if (svc.status === 'degraded') {
        level = rnd < 0.45 ? 'INFO' : rnd < 0.8 ? 'WARN' : 'ERROR'
      } else {
        level = rnd < 0.65 ? 'INFO' : rnd < 0.9 ? 'WARN' : 'ERROR'
      }
      state.logs.push({
        id: uuid(),
        serviceId: svc.id,
        serviceName: svc.name,
        level,
        message: makeLogMessage(level),
        timestamp: now
      })
    }

    // Generate alert when status worsens
    const statusOrder: Record<ServiceStatus, number> = {
      healthy: 0,
      degraded: 1,
      critical: 2,
      down: 3
    }
    if (statusOrder[svc.status] > statusOrder[prevStatus]) {
      const severity: AlertSeverity =
        svc.status === 'critical' || svc.status === 'down' ? 'critical' : 'warning'
      const newAlert: Alert = {
        id: uuid(),
        serviceId: svc.id,
        serviceName: svc.name,
        severity,
        message: makeAlertMessage(severity, svc.name),
        timestamp: now,
        status: 'active'
      }
      state.alerts.push(newAlert)
      mockEvents.emit('new-alert', newAlert)
    }
  })

  // trim to keep memory bounded
  if (state.logs.length > MAX_LOGS) state.logs.splice(0, state.logs.length - MAX_LOGS)
  if (state.alerts.length > MAX_ALERTS) state.alerts.splice(0, state.alerts.length - MAX_ALERTS)
}

let ticker: NodeJS.Timeout | null = null

export function startTicker(): void {
  if (ticker) return
  ticker = setInterval(tick, 500)
}

export function stopTicker(): void {
  if (ticker) clearInterval(ticker)
  ticker = null
}

// ---------- query helpers --------------------------------------------------

export function getServices(): Service[] {
  return [...state.services]
}

export function getService(id: string): Service | undefined {
  return state.services.find((s) => s.id === id)
}

export function getMetrics(id: string, rangeSec?: number): MetricPoint[] {
  const arr = state.metrics[id]
  if (!arr || arr.length === 0) return []

  if (!rangeSec || rangeSec <= 0) {
    rangeSec = 30 * 60 // default 30 minutes
  }

  const cutoff = Date.now() - rangeSec * 1000
  const filtered = arr.filter((p) => p.timestamp >= cutoff)

  // Cap at 300 points; sample evenly when series is longer
  if (filtered.length <= 300) return filtered
  const step = filtered.length / 300
  return Array.from({ length: 300 }, (_, i) => filtered[Math.round(i * step)])
}

interface PaginationParams {
  page?: number
  limit?: number
}

interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

function paginate<T>(items: T[], page = 1, limit = 20): PaginatedResult<T> {
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
    timeRange?: number // seconds
  } & PaginationParams
): PaginatedResult<LogEntry> {
  // Newest first so page 1 = most recent
  let items = [...state.logs].reverse()

  if (opts.serviceId) {
    items = items.filter((l) => l.serviceId === opts.serviceId)
  }
  if (opts.level && opts.level !== 'all') {
    const upper = opts.level.toUpperCase()
    items = items.filter((l) => l.level === upper)
  }
  if (opts.search) {
    const q = opts.search.toLowerCase()
    items = items.filter(
      (l) => l.message.toLowerCase().includes(q) || l.serviceName.toLowerCase().includes(q)
    )
  }
  if (opts.timeRange && opts.timeRange > 0) {
    // timeRange is seconds → multiply by 1000 for ms comparison
    const cutoff = Date.now() - opts.timeRange * 1000
    items = items.filter((l) => l.timestamp >= cutoff)
  }
  return paginate(items, opts.page, opts.limit)
}

export function queryAlerts(
  opts: {
    severity?: string
    status?: string
    timeRange?: number // seconds
  } & PaginationParams
): PaginatedResult<Alert> {
  // Newest first
  let items = [...state.alerts].reverse()

  if (opts.severity) {
    items = items.filter((a) => a.severity === opts.severity)
  }
  if (opts.status) {
    items = items.filter((a) => a.status === opts.status)
  }
  if (opts.timeRange && opts.timeRange > 0) {
    // timeRange is seconds → multiply by 1000 for ms comparison
    const cutoff = Date.now() - opts.timeRange * 1000
    items = items.filter((a) => a.timestamp >= cutoff)
  }
  return paginate(items, opts.page, opts.limit)
}

export function queryAuditLogs(
  opts: {
    search?: string
    timeRange?: number // seconds
  } & PaginationParams
): PaginatedResult<AuditLogEntry> {
  // Newest first
  let items = [...state.auditLogs].reverse()

  if (opts.search) {
    const q = opts.search.toLowerCase()
    items = items.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
    )
  }
  if (opts.timeRange && opts.timeRange > 0) {
    const cutoff = Date.now() - opts.timeRange * 1000
    items = items.filter((l) => l.timestamp >= cutoff)
  }
  return paginate(items, opts.page, opts.limit)
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  state.auditLogs.push({
    id: uuid(),
    timestamp: Date.now(),
    ...entry
  })
  if (state.auditLogs.length > MAX_AUDIT_LOGS) {
    state.auditLogs.shift()
  }
}

export function acknowledgeAlert(id: string): Alert | undefined {
  const a = state.alerts.find((x) => x.id === id)
  if (a) {
    a.status = 'acknowledged'
    addAuditLog({
      user: 'admin@example.com',
      action: 'ALERT_ACKNOWLEDGE',
      target: a.serviceName,
      details: `Acknowledged alert: ${a.message}`
    })
  }
  return a
}

export function getActiveAlertCount(): number {
  return state.alerts.filter((a) => a.status === 'active').length
}

export function getStatus(): {
  overall: 'green' | 'yellow' | 'red'
  healthy: number
  degraded: number
  critical: number
  down: number
  total: number
  activeAlerts: number
} {
  const counts: Record<string, number> = {
    healthy: 0,
    degraded: 0,
    critical: 0,
    down: 0
  }
  state.services.forEach((s) => (counts[s.status] = (counts[s.status] || 0) + 1))
  
  let overall: 'green' | 'yellow' | 'red' = 'green'
  if (counts.critical > 0 || counts.down > 0) {
    overall = 'red'
  } else if (counts.degraded > 0) {
    overall = 'yellow'
  }

  return {
    overall,
    healthy: counts.healthy,
    degraded: counts.degraded,
    critical: counts.critical,
    down: counts.down,
    total: state.services.length,
    activeAlerts: state.alerts.filter((a) => a.status === 'active').length
  }
}

export function getAlertSettings(serviceId: string): ServiceAlertSettings | undefined {
  return state.alertSettings[serviceId]
}

export function updateAlertSettings(
  serviceId: string,
  settings: ServiceAlertSettings
): ServiceAlertSettings {
  state.alertSettings[serviceId] = settings
  const s = getService(serviceId)
  addAuditLog({
    user: 'admin@example.com',
    action: 'SETTINGS_UPDATE',
    target: s?.name || serviceId,
    details: 'Updated alert thresholds'
  })
  return settings
}

export function restartService(id: string): Promise<void> {
  const s = getService(id)
  if (!s) return Promise.reject(new Error('not found'))
  
  const delay = randomBetween(30000, 60000)
  s.status = 'restarting'
  s.downUntil = Date.now() + delay

  addAuditLog({
    user: 'admin@example.com',
    action: 'SERVICE_RESTART',
    target: s.name,
    details: `Initiated manual service restart (${Math.round(delay / 1000)}s recovery)`
  })
  return new Promise<void>((resolve) => {
    setTimeout(
      () => {
        s.status = 'healthy'
        delete s.downUntil
        s.uptime = 0
        state.logs.push({
          id: uuid(),
          serviceId: s.id,
          serviceName: s.name,
          level: 'INFO',
          message: 'Service restarted successfully — uptime reset',
          timestamp: Date.now()
        })
        state.alerts.push({
          id: uuid(),
          serviceId: s.id,
          serviceName: s.name,
          severity: 'info',
          message: `${s.name}: Service restarted and back to healthy`,
          timestamp: Date.now(),
          status: 'active'
        })
        resolve()
      },
      delay
    )
  })
}

export function drainService(id: string): Promise<void> {
  const s = getService(id)
  if (!s) return Promise.reject(new Error('not found'))
  addAuditLog({
    user: 'admin@example.com',
    action: 'SERVICE_DRAIN',
    target: s.name,
    details: 'Initiated manual service drain'
  })
  return new Promise<void>((resolve) => {
    setTimeout(
      () => {
        s.status = 'degraded'
        state.logs.push({
          id: uuid(),
          serviceId: s.id,
          serviceName: s.name,
          level: 'WARN',
          message: 'Service drained — no longer accepting new connections',
          timestamp: Date.now()
        })
        resolve()
      },
      randomBetween(3000, 6000)
    )
  })
}

export { state }
