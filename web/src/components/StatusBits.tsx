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
export function Sparkline({ checks, warnMs }: { checks: Check[]; warnMs?: number }) {
  const pts = checks.slice(0, 60).reverse();
  const vals = pts.map((c) => c.latency_ms ?? 0);
  const max = Math.max(warnMs ?? 0, ...vals, 1);
  const W = 560;
  const H = 90;
  const step = pts.length > 1 ? W / (pts.length - 1) : 0;
  const y = (v: number) => H - 6 - (v / max) * (H - 14);
  const d = pts
    .map((c, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(c.latency_ms ?? max).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Latency, latest ${latencyLabel(vals[vals.length - 1])}`}>
      {warnMs ? (
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
        c.status === "down" ? <circle key={c.id} cx={i * step} cy={y(0) + 4} r="2.4" fill="#c92a09" /> : null,
      )}
    </svg>
  );
}
