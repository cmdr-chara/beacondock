// Server-side client for the BeaconDock REST API.
// The API key lives only here, in the server process; the browser never sees it.

import type { ApiError, ApiResult, Check, ChecksPage, Monitor, StatusSummary } from "./types";

const BASE = (process.env.BEACONDOCK_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const KEY = process.env.BEACONDOCK_API_KEY ?? "";

export function apiConfigured() {
  return KEY.length > 0;
}

export function apiBaseUrl() {
  return BASE;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  if (!KEY) {
    return { ok: false, status: 0, error: { code: "no_api_key", message: "BEACONDOCK_API_KEY is not set" } };
  }
  try {
    const res = await fetch(`${BASE}/api/v1${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${KEY}`, Accept: "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    if (res.status === 204) return { ok: true, data: undefined as T };
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const error: ApiError = body?.error ?? { code: `http_${res.status}`, message: `API answered ${res.status}` };
      return { ok: false, status: res.status, error };
    }
    const payload = body?.data !== undefined ? body.data : (body ?? {});
    const data = body?.meta ? { data: payload, meta: body.meta } : payload;
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, status: 0, error: { code: "unreachable", message: `The BeaconDock API at ${BASE} did not answer` } };
  }
}

export function getStatus() {
  return request<StatusSummary>("/status");
}

export function listMonitors() {
  return request<Monitor[]>("/monitors");
}

export function getMonitor(id: string) {
  return request<Monitor>(`/monitors/${id}`);
}

export function listChecks(id: string, page = 1, perPage = 50) {
  return request<ChecksPage>(`/monitors/${id}/checks?page=${page}&per_page=${perPage}`);
}

export function createMonitor(params: Record<string, string | number | boolean | undefined>) {
  return request<Monitor>("/monitors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monitor: params }),
  });
}

export function updateMonitor(id: string, params: Record<string, string | number | boolean | undefined>) {
  return request<Monitor>(`/monitors/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monitor: params }),
  });
}

export function deleteMonitor(id: string) {
  return request<void>(`/monitors/${id}`, { method: "DELETE" });
}

export type { Check };
