import { storage } from '../utils/storage'
import type {
  Service,
  MetricPoint,
  LogEntry,
  AuditLogEntry,
  Alert,
  PaginatedResponse,
  ServiceAlertSettings,
  ServerEntry
} from '../types/index'

let apiPort = 3001

// Initialize API port on first load (fallback for local mock server)
async function initApiPort() {
  if (window.api) {
    apiPort = await window.api.getApiPort()
  }
}
initApiPort().catch(console.error)

/**
 * Dynamically determines the API base URL.
 * Prioritizes the active server selected by the user.
 */
export const API_BASE = () => {
  const activeServer = storage.get<ServerEntry | null>('activeServer', null)
  if (activeServer?.url) {
    return activeServer.url.replace(/\/$/, '')
  }
  return `http://127.0.0.1:${apiPort}`
}

// Services
export async function getServices(period?: number) {
  const params = new URLSearchParams()
  if (period) params.append('period', period.toString())
  const res = await fetch(`${API_BASE()}/api/services?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch services: ${res.statusText}`)
  return res.json() as Promise<Service[]>
}

export async function getService(id: string) {
  const res = await fetch(`${API_BASE()}/api/services/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch service: ${res.statusText}`)
  return res.json() as Promise<Service>
}

export async function restartService(id: string) {
  const res = await fetch(`${API_BASE()}/api/services/${id}/restart`, { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to restart service: ${res.statusText}`)
  return res.json()
}

export async function drainService(id: string) {
  const res = await fetch(`${API_BASE()}/api/services/${id}/drain`, { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to drain service: ${res.statusText}`)
  return res.json()
}

// Metrics
export async function getMetrics(serviceId: string, range?: number) {
  const params = new URLSearchParams()
  if (range) params.append('range', range.toString())
  const res = await fetch(`${API_BASE()}/api/services/${serviceId}/metrics?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`)
  return res.json() as Promise<MetricPoint[]>
}

// Logs
export async function getLogs(opts?: {
  serviceId?: string
  level?: string
  search?: string
  page?: number
  limit?: number
  timeRange?: number
}) {
  const params = new URLSearchParams()
  if (opts?.serviceId) params.append('service', opts.serviceId)
  if (opts?.level) params.append('level', opts.level)
  if (opts?.search) params.append('search', opts.search)
  if (opts?.page) params.append('page', opts.page.toString())
  if (opts?.limit) params.append('limit', opts.limit.toString())
  if (opts?.timeRange) params.append('timeRange', opts.timeRange.toString())
  const res = await fetch(`${API_BASE()}/api/logs?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch logs: ${res.statusText}`)
  return res.json() as Promise<PaginatedResponse<LogEntry>>
}

export async function getServiceLogs(
  serviceId: string,
  opts?: { level?: string; search?: string; page?: number; limit?: number; timeRange?: number }
) {
  const params = new URLSearchParams()
  if (opts?.level) params.append('level', opts.level)
  if (opts?.search) params.append('search', opts.search)
  if (opts?.page) params.append('page', opts.page.toString())
  if (opts?.limit) params.append('limit', opts.limit.toString())
  if (opts?.timeRange) params.append('timeRange', opts.timeRange.toString())
  const res = await fetch(`${API_BASE()}/api/services/${serviceId}/logs?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch service logs: ${res.statusText}`)
  return res.json() as Promise<PaginatedResponse<LogEntry>>
}

// Alerts
export async function getAlerts(opts?: {
  severity?: string
  status?: string
  page?: number
  limit?: number
  timeRange?: number
}) {
  const params = new URLSearchParams()
  if (opts?.severity) params.append('severity', opts.severity)
  if (opts?.status) params.append('status', opts.status)
  if (opts?.page) params.append('page', opts.page.toString())
  if (opts?.limit) params.append('limit', opts.limit.toString())
  if (opts?.timeRange) params.append('timeRange', opts.timeRange.toString())
  const res = await fetch(`${API_BASE()}/api/alerts?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`)
  return res.json() as Promise<PaginatedResponse<Alert>>
}

export async function getActiveAlertCount() {
  const res = await fetch(`${API_BASE()}/api/alerts/active-count`)
  if (!res.ok) throw new Error(`Failed to fetch active alert count: ${res.statusText}`)
  return res.json() as Promise<{ count: number }>
}

export async function acknowledgeAlert(id: string) {
  const res = await fetch(`${API_BASE()}/api/alerts/${id}/acknowledge`, { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to acknowledge alert: ${res.statusText}`)
  return res.json() as Promise<Alert>
}

// Audit Logs
export async function getAuditLogs(opts?: { search?: string; page?: number; limit?: number; timeRange?: number }) {
  const params = new URLSearchParams()
  if (opts?.search) params.append('search', opts.search)
  if (opts?.page) params.append('page', opts.page.toString())
  if (opts?.limit) params.append('limit', opts.limit.toString())
  if (opts?.timeRange) params.append('timeRange', opts.timeRange.toString())
  const res = await fetch(`${API_BASE()}/api/audit-logs?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.statusText}`)
  return res.json() as Promise<PaginatedResponse<AuditLogEntry>>
}

// Status
export async function getStatus() {
  const res = await fetch(`${API_BASE()}/api/status`)
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.statusText}`)
  return res.json()
}

// Alert Settings
export async function getAlertSettings(serviceId: string) {
  const res = await fetch(`${API_BASE()}/api/services/${serviceId}/alert-settings`)
  if (!res.ok) throw new Error(`Failed to fetch alert settings: ${res.statusText}`)
  return res.json() as Promise<ServiceAlertSettings>
}

export async function updateAlertSettings(serviceId: string, settings: ServiceAlertSettings) {
  const res = await fetch(`${API_BASE()}/api/services/${serviceId}/alert-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  })
  if (!res.ok) throw new Error(`Failed to update alert settings: ${res.statusText}`)
  return res.json() as Promise<ServiceAlertSettings>
}
