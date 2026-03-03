// Auto-generated shared types for renderer

export type ServiceStatus = "healthy" | "degraded" | "critical" | "down";
export interface Service {
  id: string;
  name: string;
  status: ServiceStatus;
  uptime: number;
  cpu: number;
  ram: number;
  disk: number;
  iops: number;
  ip: string;
  port: number;
  version: string;
}

export interface MetricPoint {
  timestamp: number | string;
  cpu: number;
  ram: number;
  disk: number;
  iops: number;
}

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "acknowledged";
export interface Alert {
  id: string;
  serviceId: string;
  serviceName: string;
  severity: AlertSeverity;
  message: string;
  timestamp: number | string;
  status: AlertStatus;
}

export type LogLevel = "INFO" | "WARN" | "ERROR";
export interface LogEntry {
  id: string;
  serviceId: string;
  serviceName: string;
  level: LogLevel;
  message: string;
  timestamp: number | string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AppSettings {
  pollingInterval: number;
  autoRefresh: boolean;
}

export interface MetricThreshold {
  warning: number;
  critical: number;
  notify: boolean;
}

export interface ServiceAlertSettings {
  cpu: MetricThreshold;
  ram: MetricThreshold;
  disk: MetricThreshold;
  iops: MetricThreshold;
}

export interface ServerEntry {
  id: string;
  name: string;
  url: string;
  lastConnected: number;
}
