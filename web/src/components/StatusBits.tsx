import type { Check, MonitorStatus } from "@/lib/types";
import { latencyLabel, STATUS_LABEL } from "@/lib/format";

export function Dot({ status }: { status: MonitorStatus }) {
  return <span className={`st-dot st-${status}`} aria-hidden="true" />;
}

export function StatusPill({ status }: { status: MonitorStatus }) {
  return (
    <span className={`st-pill st-${status}`}>
      <span className="st-dot" style={{ background: "currentColor" }} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

// One 30-day-style strip per monitor, folded from the checks the API gives back.
export function UptimeStrip({ checks }: { checks: Check[] }) {
  const cells = checks.slice(0, 40);
  while (cells.length < 40) cells.push(null as unknown as Check);
  return (
    <span className="upstrip" aria-hidden="true">
      {cells.map((c, i) => (
        <i
          key={i}
          className={
            !c ? "b-none" : c.status === "up" ? "b-up st-up" : c.status === "degraded" ? "b-dg st-degraded" : "b-dn st-down"
          }
        />
      ))}
    </span>
  );
}

// A small latency sparkline drawn from real checks (no smoothing, dots on failures).
// Scales to the data's own min..max band so a flat-but-healthy series still fills
// the box; a warn threshold far above the data would squash the line to the floor.
export function Sparkline({ checks, warnMs }: { checks: Check[]; warnMs?: number }) {
  const pts = checks.slice(0, 60).reverse();
  if (pts.length === 0) return null;
  const vals = pts.map((c) => c.latency_ms ?? 0);
  let lo = Math.min(...vals);
  let hi = Math.max(...vals, 1);
  if (hi - lo < 4) {
    const pad = Math.max(2, hi * 0.1);
    lo = Math.max(0, lo - pad);
    hi += pad;
  }
  const span = hi - lo;
  const W = 560;
  const H = 90;
  const step = pts.length > 1 ? W / (pts.length - 1) : 0;
  const y = (v: number) => H - 8 - ((v - lo) / span) * (H - 18);
  const d = pts
    .map((c, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(c.latency_ms ?? lo).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Latency, latest ${latencyLabel(vals[vals.length - 1])}`}>
      {warnMs && warnMs <= hi * 1.05 ? (
        <line
          x1="0"
          x2={W}
          y1={y(warnMs)}
          y2={y(warnMs)}
          stroke="var(--p-muted)"
          strokeDasharray="3 4"
          strokeWidth="1"
          opacity=".65"
        />
      ) : null}
      <path d={d} fill="none" stroke="var(--p-accent)" strokeWidth="1.6" />
      {pts.map((c, i) =>
        c.status === "down" ? (
          <circle key={c.id} cx={i * step} cy={Math.min(y(0) + 4, H - 4)} r="2.4" fill="#c92a09" />
        ) : null,
      )}
    </svg>
  );
}
