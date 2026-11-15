// Shapes of the BeaconDock REST API (app/controllers/api/v1).

export type MonitorStatus = "pending" | "up" | "down" | "degraded";

export interface Monitor {
  id: number;
  name: string;
  url: string;
  host: string;
  http_method: "GET" | "HEAD";
  interval_seconds: number;
  timeout_seconds: number;
  expected_status: number;
  warn_latency_ms: number;
  active: boolean;
  last_status: MonitorStatus;
  last_checked_at: string | null;
  consecutive_failures: number;
  uptime_24h: number | null;
  uptime_30d: number | null;
  created_at: string;
  updated_at: string;
}

export interface Check {
  id: number;
  status: MonitorStatus;
  http_status: number | null;
  latency_ms: number | null;
  error: string | null;
  checked_at: string;
}

export interface StatusSummary {
  total: number;
  active: number;
  counts: Record<MonitorStatus, number>;
  open_incidents: number;
}

export interface ChecksPage {
  data: Check[];
  meta: { page: number; per_page: number; total_count: number; total_pages: number };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: ApiError };
