import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({ baseURL: BASE });

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreditStatus = "ok" | "warning" | "blocked";
export type GatewayStatus = "unlocked" | "blocked";
export type AppType = "Nuovo" | "Knox";
export type LogLevel = "info" | "ok" | "warn" | "err";
export type LogSource = "sadmin" | "nuovo" | "knox" | "sys";

export interface DeviceRecord {
  identif: string;
  nombre: string;
  num_cred: string;
  nom_tipocred: string;
  app: AppType;
  dias_mora: number;
  mora_total: number;
  credit_status: CreditStatus;
  gateway: GatewayStatus;
  saldo_cap_hoy?: number;
  fecha_ini?: string;
  last_action?: string;
  last_action_at?: string;
  last_synced_at?: string;
}

export interface DashboardMetrics {
  total: number;
  ok: number;
  warning: number;
  blocked: number;
  mora_total_sum: number;
  last_sync?: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  source: LogSource;
  message: string;
  level: LogLevel;
  num_cred?: string;
  identif?: string;
}

export interface ActionResult {
  num_cred: string;
  identif: string;
  app: string;
  action: string;
  success: boolean;
  message: string;
  timestamp: string;
}

export interface SyncResult {
  success: boolean;
  total_credits: number;
  blocked: number;
  unblocked: number;
  warnings: number;
  errors: number;
  duration_ms: number;
  timestamp: string;
  actions: ActionResult[];
}

export interface SchedulerStatus {
  running: boolean;
  jobs: number;
  next_run?: string;
  last_result?: SyncResult;
}

// ─── Devices ─────────────────────────────────────────────────────────────────

export const getDevices = (params?: {
  status?: string;
  app?: string;
  q?: string;
}) => api.get<DeviceRecord[]>("/devices/", { params }).then((r) => r.data);

export const getMetrics = () =>
  api.get<DashboardMetrics>("/devices/metrics").then((r) => r.data);

export const deviceAction = (
  num_cred: string,
  identif: string,
  app: string,
  action: "block" | "unblock"
) =>
  api
    .post<ActionResult>("/devices/action", { num_cred, identif, app, action })
    .then((r) => r.data);

export const bulkAction = (
  num_creds: string[],
  action: "block" | "unblock"
) =>
  api
    .post<ActionResult[]>("/devices/bulk-action", { num_creds, action })
    .then((r) => r.data);

// ─── Automation ───────────────────────────────────────────────────────────────

export const triggerSync = (start_date?: string, end_date?: string) =>
  api.post<SyncResult>("/automation/sync", { start_date, end_date }).then((r) => r.data);

export const getSchedulerStatus = () =>
  api.get<SchedulerStatus>("/automation/status").then((r) => r.data);

export const startScheduler = () =>
  api.post("/automation/scheduler/start").then((r) => r.data);

export const stopScheduler = () =>
  api.post("/automation/scheduler/stop").then((r) => r.data);

// ─── Logs ─────────────────────────────────────────────────────────────────────

export const getLogs = (params?: {
  source?: string;
  level?: string;
  limit?: number;
}) => api.get<LogEntry[]>("/logs/", { params }).then((r) => r.data);

export const clearLogs = () => api.delete("/logs/").then((r) => r.data);

// ─── Settings ─────────────────────────────────────────────────────────────────

export const getSettings = () =>
  api.get("/settings/").then((r) => r.data);

export const testConnection = (apiName: string) =>
  api
    .post<{ success: boolean; status_code?: number; message: string }>(
      `/settings/test-connection/${apiName}`
    )
    .then((r) => r.data);