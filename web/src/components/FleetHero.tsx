import type { Check, Monitor, StatusSummary } from "@/lib/types";
import { intervalLabel, latencyLabel, STATUS_LABEL, timeAgo, uptimeLabel } from "@/lib/format";

const TONE: Record<Monitor["last_status"], string> = {
  down: "#f08d77",
  degraded: "#f3c98b",
  pending: "#b8bdc4",
  up: "#9fd3b5",
};

// hero--centred: pill, centred h1 with inline mark, lead, two buttons, then a lit
// painterly-landscape frame holding the live BeaconDock console window.
export default function FleetHero({
  monitors,
  checksById,
  status,
}: {
  monitors: Monitor[];
  checksById: Map<number, Check[]>;
  status: StatusSummary | null;
}) {
  const rank = { down: 0, degraded: 1, pending: 2, up: 3 } as const;
  const sorted = [...monitors].sort(
    (a, b) => rank[a.last_status] - rank[b.last_status] || a.name.localeCompare(b.name),
  );
  const lead = sorted[0] ?? null;
  const leadChecks = lead ? (checksById.get(lead.id) ?? []) : [];
  const latest = leadChecks[0] ?? null;

  const pillLeft = status ? `${status.total} monitors` : "API offline";
  const pillRight = status
    ? `${status.counts.up} up · ${status.counts.down} down · ${status.open_incidents} open`
    : "Set BEACONDOCK_API_KEY";

  const leadStepMsg = latest
    ? `CheckMonitorJob -> HttpCheckService (${
        latest.latency_ms != null ? `${Math.round(latest.latency_ms)} ms` : "timeout"
      }${latest.http_status ? `, HTTP ${latest.http_status}` : ""})`
    : "ScheduleChecksJob -> waiting for next sweep";

  const leadOutcome = lead
    ? lead.last_status === "down"
      ? `${lead.name} is down (${lead.consecutive_failures} consecutive failures). ${
          latest?.error ?? "Endpoint unreachable"
        }.`
      : lead.last_status === "degraded"
        ? `${lead.name} answered slower than ${lead.warn_latency_ms} ms (${latencyLabel(latest?.latency_ms)}).`
        : lead.last_status === "pending"
          ? `${lead.name} is queued for its first HTTP probe.`
          : `${lead.name} answered HTTP ${latest?.http_status ?? lead.expected_status} in ${latencyLabel(latest?.latency_ms)}.`
    : "Connect the Rails API at port 3000 to stream live monitor checks into this window.";

  return (
    <section className="hero hero--centred" data-enter aria-labelledby="hero-h">
      <div className="wrap">
        <div className="hero-text">
          <div className="hero__c">
            <a className="pill" href="#fleet">
              <span>{pillLeft}</span>
              <span className="muted">{pillRight}</span>
            </a>
            <h1 id="hero-h" aria-label="Uptime monitor for HTTP APIs">
              <span className="ly-mark" aria-hidden="true"></span> Uptime monitor for HTTP APIs
            </h1>
            <p className="hero__lead">
              Polls HTTP endpoints every 30 s to 1 h, flags slow replies, and opens an incident after two consecutive
              failures.
            </p>
            <div className="btn-row">
              <a className="btn btn--primary" href="/monitors/new">
                Add a monitor
                <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                  <path className="m-arrow__stem" d="M1 6h8" />
                  <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
                </svg>
              </a>
              <a className="btn btn--secondary" href="#fleet">
                See the fleet
              </a>
            </div>
          </div>

          <div
            className="hero__window"
            data-fx="painterly-landscape"
            data-fx-seed="7"
            role="img"
            aria-label="BeaconDock console window showing the worst-first monitor queue and active check detail"
          >
            <div className="ly-piece d-win d-win--dark" aria-hidden="true">
              <div className="d-win__bar">
                <span className="d-win__dots">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
                <span>
                  <b>{lead ? lead.name : "BeaconDock"}</b> · {lead ? lead.host : "api/v1"}
                </span>
                <span className="sp"></span>
                <span>{lead ? `${lead.http_method} · every ${intervalLabel(lead.interval_seconds)}` : "GET · 60 s"}</span>
              </div>
              <div className="d-win__body">
                <div className="d-win__inbox">
                  <div className="d-win__q">Filter fleet</div>
                  {sorted.slice(0, 4).map((m, idx) => (
                    <div key={m.id} className={`d-win__row${idx === 0 ? " is-on" : ""}`}>
                      <i style={{ background: TONE[m.last_status] }}>{m.name.slice(0, 2).toUpperCase()}</i>
                      <b>{m.name}</b>
                      <time>{STATUS_LABEL[m.last_status]}</time>
                      <span>{m.host}</span>
                    </div>
                  ))}
                  {sorted.length === 0 ? (
                    <div className="d-win__row is-on">
                      <i style={{ background: "#b8bdc4" }}>BD</i>
                      <b>No monitors</b>
                      <time>—</time>
                      <span>localhost:3000</span>
                    </div>
                  ) : null}
                </div>
                <div className="d-win__convo">
                  <div className="d-chat" data-ly-steps="900">
                    <div className="d-msg d-msg--me">
                      {lead
                        ? `${lead.http_method} ${lead.host} · expect HTTP ${lead.expected_status}`
                        : "GET /api/v1/status · Bearer SHA-256"}
                    </div>
                    <div className="d-tool" data-step="">
                      {leadStepMsg}
                    </div>
                    <div className="d-msg d-msg--bot" data-step="">
                      {leadOutcome}
                      <small>
                        {lead?.uptime_30d != null ? `${uptimeLabel(lead.uptime_30d)} 30d` : "30d rollup"} ·{" "}
                        {lead ? timeAgo(lead.last_checked_at) : "live"}
                      </small>
                    </div>
                    <div className="d-acts" data-step="">
                      <span>Open monitor</span>
                      <span>Edit threshold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
