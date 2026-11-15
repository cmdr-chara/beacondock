// Display helpers shared by server and client components.

import type { MonitorStatus } from "./types";

export const STATUS_LABEL: Record<MonitorStatus, string> = {
  pending: "Pending",
  up: "Up",
  down: "Down",
  degraded: "Degraded",
};

// Worst first — the TUI's own order.
export const STATUS_ORDER: MonitorStatus[] = ["down", "degraded", "pending", "up"];

export function intervalLabel(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  if (seconds < 3600) return `${seconds / 60} min`;
  return "1 h";
}

export function latencyLabel(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;
}

export function uptimeLabel(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "—";
  return `${pct.toFixed(2).replace(/\.?0+$/, "")} %`;
}

export function timeAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "never";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s} s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60} min ago`;
  const d = Math.floor(h / 24);
  return `${d} d ${h % 24} h ago`;
}

export function httpStatusLabel(code: number | null | undefined): string {
  return code === null || code === undefined ? "—" : String(code);
}

export function clockTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
