import type { Check, Monitor, StatusSummary } from "@/lib/types";
import { clockTime, latencyLabel, STATUS_LABEL, uptimeLabel } from "@/lib/format";

// The triptych collage's pieces: live monitor cards drawn from real fleet data.

function dayCells(m: Monitor, checks: Check[]) {
  const cells = checks.slice(0, 14);
  while (cells.length < 14) cells.push(null as unknown as Check);
  return cells.map((c, i) => (
    <i
      key={i}
      className={
        !c ? "b-none" : c.status === "up" ? "b-up st-up" : c.status === "degraded" ? "b-dg st-degraded" : "b-dn st-down"
      }
    />
  ));
}

export function MonitorPiece({ m, checks, style }: { m: Monitor; checks: Check[]; style: React.CSSProperties }) {
  const last = checks.find((c) => c.latency_ms != null);
  return (
    <div className="ly-piece pc-monitor" style={style}>
      <h4>{m.name}</h4>
      <div className="pc-host">{m.host}</div>
      <div className="pc-uptime st-up">{dayCells(m, checks)}</div>
      <div className="pc-row">
        <span className={`st-pill st-${m.last_status}`}>
          <span className="st-dot" style={{ background: "currentColor" }} />
          {STATUS_LABEL[m.last_status]}
        </span>
        <span className="pc-stat">{latencyLabel(last?.latency_ms)}</span>
      </div>
    </div>
  );
}

const short = (s: string, n = 16) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export function BigStatPiece({
  num,
  cap,
  sub,
  tone,
  style,
}: {
  num: string;
  cap: string;
  sub?: string;
  tone?: string;
  style: React.CSSProperties;
}) {
  return (
    <div className={`ly-piece pc-bigstat ${tone ?? ""}`} style={style}>
      <h4 className="num">{num}</h4>
      <span className="cap">{cap}</span>
      {sub ? <span className="pc-sub">{short(sub)}</span> : null}
    </div>
  );
}

// The fleet as a check matrix: one row per monitor, one cell per recent check —
// the anchor piece that fills the collage's far corner like the kit's big photo.
export function MatrixPiece({
  monitors,
  byId,
  cap,
  style,
}: {
  monitors: Monitor[];
  byId: Map<number, Check[]>;
  cap: string;
  style: React.CSSProperties;
}) {
  return (
    <div className="ly-piece pc-matrix" style={style}>
      <ul>
        {monitors.slice(0, 8).map((m) => (
          <li key={m.id}>
            <span className="nm">{short(m.name)}</span>
            <div className="mx">{dayCells(m, byId.get(m.id) ?? [])}</div>
            <b className={`st-${m.last_status}`}>{STATUS_LABEL[m.last_status]}</b>
          </li>
        ))}
      </ul>
      <span className="cap">{cap}</span>
    </div>
  );
}

export function SparkPiece({
  checks,
  cap,
  fill,
  style,
}: {
  checks: Check[];
  cap: string;
  fill?: boolean;
  style: React.CSSProperties;
}) {
  const pts = checks.slice(0, 24).reverse();
  const vals = pts.map((c) => c.latency_ms ?? 0);
  const max = Math.max(...vals, 1);
  const W = 200;
  const H = 52;
  const step = pts.length > 1 ? W / (pts.length - 1) : 0;
  const y = (v: number) => H - 4 - (v / max) * (H - 10);
  const d = pts.map((c, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${y(c.latency_ms ?? max).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]?.latency_ms;
  return (
    <div className={`ly-piece pc-spark${fill ? " pc-spark--fill" : ""}`} style={style}>
      <span className="cap">
        {cap}
        <b>{latencyLabel(last)}</b>
      </span>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={fill ? "none" : undefined} aria-hidden="true">
        <defs>
          <linearGradient id="pc-spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--p-accent)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--p-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L${W},${H} L0,${H} Z`} fill="url(#pc-spark-fill)" stroke="none" />
        <path d={d} fill="none" stroke="var(--p-accent)" strokeWidth="1.6" />
        {pts.map((c, i) =>
          c.status === "down" ? <circle key={c.id} cx={i * step} cy={y(0) + 2} r="1.8" fill="#ff4a1f" /> : null,
        )}
      </svg>
    </div>
  );
}

// A miniature log of the latest checks — the product itself as a collage piece.
// `rows` lets an anchored piece fill its height with a longer feed.
export function LogPiece({
  m,
  checks,
  rows = 4,
  style,
}: {
  m: Monitor;
  checks: Check[];
  rows?: number;
  style: React.CSSProperties;
}) {
  return (
    <div className="ly-piece pc-log" style={style}>
      <span className="cap">{m.name}</span>
      <ul>
        {checks.slice(0, rows).map((c) => (
          <li key={c.id}>
            <i className={`st-dot st-${c.status}`} />
            <time>{clockTime(c.checked_at)}</time>
            <em>{c.error ?? (c.http_status ? `HTTP ${c.http_status}` : STATUS_LABEL[c.status])}</em>
            {c.latency_ms != null ? <b>{latencyLabel(c.latency_ms)}</b> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Two collage sets built from the fleet: worst monitors first (the TUI's own
// sort). Like the kit's recipe, a big anchor piece sits behind and the cards
// layer over it, ending at 96% of the collage's width and height, so the pause
// disc lands on a corner rather than on empty ground.
export function collageSets(monitors: Monitor[], byId: Map<number, Check[]>, status: StatusSummary | null) {
  const sorted = [...monitors].sort((a, b) => {
    const rank = { down: 0, degraded: 1, pending: 2, up: 3 } as const;
    return rank[a.last_status] - rank[b.last_status] || a.name.localeCompare(b.name);
  });
  const sets: React.ReactNode[][] = [];
  const positions = [
    // set A — the fleet matrix anchors left+bottom; cards cover its cell edge,
    // never its name column
    [
      { left: "4%", top: "30%", width: "58%", height: "66%" },
      { left: "46%", top: "6%", width: "50%" },
      { left: "4%", top: "4%", width: "40%" },
      { left: "64%", top: "58%", width: "32%", height: "38%" },
    ],
    // set B — the check log is the tall left anchor; a card, a stat and the
    // filled sparkline take the right half without covering the log's text
    [
      { left: "4%", top: "6%", width: "48%", height: "62%" },
      { left: "50%", top: "8%", width: "46%" },
      { left: "6%", top: "72%", width: "44%" },
      { left: "56%", top: "54%", width: "40%", height: "42%" },
    ],
  ];
  const m0 = sorted[0];
  const m1 = sorted[1] ?? sorted[0];
  // the sparkline belongs to the monitor with the most real latency readings,
  // the log to the one with the most checks — an empty card is a broken card
  const sparkM = [...sorted].sort(
    (a, b) => (byId.get(b.id) ?? []).filter((c) => c.latency_ms != null).length - (byId.get(a.id) ?? []).filter((c) => c.latency_ms != null).length,
  )[0];
  const logM = [...sorted].sort((a, b) => (byId.get(b.id) ?? []).length - (byId.get(a.id) ?? []).length)[0];
  const uptimeM = sorted.find((m) => m.uptime_30d != null);
  if (m0) {
    sets.push([
      <MatrixPiece key="x" monitors={sorted} byId={byId} cap="fleet · latest checks" style={positions[0][0]} />,
      <MonitorPiece key="a" m={m0} checks={byId.get(m0.id) ?? []} style={positions[0][1]} />,
      sparkM ? <SparkPiece key="b" checks={byId.get(sparkM.id) ?? []} cap={short(sparkM.name)} style={positions[0][2]} /> : null,
      status ? (
        <BigStatPiece
          key="d"
          num={String(status.open_incidents)}
          cap={`open incident${status.open_incidents === 1 ? "" : "s"}`}
          sub={status.open_incidents > 0 ? m0.name : undefined}
          tone={status.open_incidents > 0 ? "st-down" : ""}
          style={positions[0][3]}
        />
      ) : (
        <BigStatPiece key="d" num={String(sorted.length)} cap="monitors" style={positions[0][3]} />
      ),
    ]);
  }
  if (m1) {
    sets.push([
      logM ? <LogPiece key="l" m={logM} checks={byId.get(logM.id) ?? []} rows={9} style={positions[1][0]} /> : null,
      <MonitorPiece key="a" m={m1} checks={byId.get(m1.id) ?? []} style={positions[1][1]} />,
      uptimeM ? (
        <BigStatPiece key="c" num={uptimeLabel(uptimeM.uptime_30d)} cap="uptime 30 d" sub={uptimeM.name} style={positions[1][2]} />
      ) : (
        <BigStatPiece key="c" num={String(status?.counts.up ?? 0)} cap="monitors up" tone="st-up" style={positions[1][2]} />
      ),
      sparkM ? <SparkPiece key="s" checks={byId.get(sparkM.id) ?? []} cap={short(sparkM.name)} fill style={positions[1][3]} /> : null,
    ]);
  }
  return sets.filter((s) => s.some(Boolean));
}
