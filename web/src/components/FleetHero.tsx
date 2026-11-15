import type { Check, Monitor, StatusSummary } from "@/lib/types";
import { latencyLabel, STATUS_LABEL } from "@/lib/format";

// hero--centred: pill, centred h1, lead, two buttons, then a lit painterly-landscape
// frame holding the BeaconDock fleet window (.ui-win).
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

  const pillLeft = status ? `${status.total} monitors` : "API offline";
  const pillRight = status
    ? `${status.counts.up} up · ${status.counts.down} down · ${status.open_incidents} open`
    : "Set BEACONDOCK_API_KEY";

  return (
    <section className="hero hero--centred" data-enter aria-labelledby="hero-h">
      <div className="wrap">
        <div className="hero-text">
          <div className="hero__c">
            <a className="pill" href="#fleet">
              <span>{pillLeft}</span>
              <span className="muted">{pillRight}</span>
            </a>
            <h1 id="hero-h">Uptime monitor for HTTP APIs</h1>
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
            aria-label="BeaconDock console window showing the worst-first monitor queue"
          >
            <div
              className="ly-piece ui ui-panel ui-win"
              style={
                {
                  "--fx-bg": "#141619",
                  "--fx-surface": "#1a1d21",
                  "--fx-ink": "#eff0f1",
                  "--fx-muted": "#9da3ac",
                  "--fx-accent": "#57d98e",
                  "--fx-accent-ink": "#111111",
                } as React.CSSProperties
              }
              aria-hidden="true"
            >
              <div className="ui-win__bar">
                <span className="ui-dots">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
                <span className="ui-win__crumb">
                  BeaconDock <i>/</i> <b>{lead ? lead.name : "Fleet"}</b>
                </span>
                <span className="ui-spacer"></span>
                <span className="ui-win__search">
                  <svg className="ui-icon" viewBox="0 0 16 16">
                    <circle cx="7" cy="7" r="4.5" />
                    <path d="m10.5 10.5 3 3" />
                  </svg>
                  <span className="ui-win__ph">Filter fleet</span>
                  <span className="ui-kbd">/</span>
                </span>
              </div>
              <div className="ui-win__body">
                <nav className="ui-win__side">
                  <span className="ui-win__nav is-on">
                    All<em>{status?.total ?? monitors.length}</em>
                  </span>
                  <span className="ui-win__nav">
                    Down<em>{status?.counts.down ?? 0}</em>
                  </span>
                  <span className="ui-win__nav">
                    Degraded<em>{status?.counts.degraded ?? 0}</em>
                  </span>
                  <span className="ui-win__nav">
                    Pending<em>{status?.counts.pending ?? 0}</em>
                  </span>
                  <span className="ui-win__nav">
                    Up<em>{status?.counts.up ?? 0}</em>
                  </span>
                </nav>
                <div className="ui-win__main">
                  <div className="ui-win__cols fleet__cols">
                    <span>Monitor</span>
                    <span>Status</span>
                    <span>Latency</span>
                  </div>
                  <ul className="ui-win__rows">
                    {sorted.slice(0, 5).map((m) => {
                      const latestCheck = (checksById.get(m.id) ?? []).find((c) => c.latency_ms != null);
                      return (
                        <li key={m.id} className="ui-win__row">
                          <div className="ui-win__hit">
                            <span className="ui-avatar" data-tone={String((m.id % 5) + 1)}>
                              {m.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="ui-win__who">{m.name}</span>
                            <span className="ui-win__sub">
                              {m.host}
                              {!m.active ? " · paused" : ""}
                            </span>
                            <span className={`ui-win__st st-${m.last_status}`}>{STATUS_LABEL[m.last_status]}</span>
                            <span className="ui-win__age">{latencyLabel(latestCheck?.latency_ms)}</span>
                          </div>
                        </li>
                      );
                    })}
                    {sorted.length === 0 ? (
                      <li className="ui-win__row">
                        <div className="ui-win__hit">
                          <span className="ui-avatar" data-tone="4">
                            BD
                          </span>
                          <span className="ui-win__who">Connect Rails API</span>
                          <span className="ui-win__sub">localhost:3000/api/v1</span>
                          <span className="ui-win__st st-pending">Pending</span>
                          <span className="ui-win__age">—</span>
                        </div>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
