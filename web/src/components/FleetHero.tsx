import type { Check, Monitor, StatusSummary } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/format";
import { collageSets } from "./MonitorPieces";

// hero--triptych: headline span-3, a collage of live monitor cards on span-6,
// the primary button ending on the right line.
export default function FleetHero({
  monitors,
  checksById,
  status,
}: {
  monitors: Monitor[];
  checksById: Map<number, Check[]>;
  status: StatusSummary | null;
}) {
  const sets = collageSets(monitors, checksById, status);
  const down = status?.counts.down ?? 0;
  const incidents = status?.open_incidents ?? 0;
  const notice = status
    ? `${status.total} monitors · ${down} down · ${incidents} open incident${incidents === 1 ? "" : "s"}`
    : "API offline";

  return (
    <section className="hero hero--triptych bg-topglow" data-enter aria-labelledby="hero-h">
      <div className="wrap">
        <div className="hero-text grid hero__grid">
          <div className="span-3">
            <p className="hero-notice">{notice}</p>
            <h1 id="hero-h">Uptime, self-hosted</h1>
            <p className="hero__lead">
              Checks every 30 s to 1 h, an incident after two consecutive failures, 30 days of history — read from the
              BeaconDock API.
            </p>
            <dl className="hero-facts">
              <div>
                <dt>Cadence</dt>
                <dd>30 s – 1 h</dd>
              </div>
              <div>
                <dt>Incident after</dt>
                <dd>2 failures</dd>
              </div>
              <div>
                <dt>History kept</dt>
                <dd>30 days</dd>
              </div>
            </dl>
          </div>
          {sets.length > 0 ? (
            <div
              className="ly-collage span-6 start-4"
              role="img"
              aria-label="The monitors needing attention first: cards with live status, uptime strips and a latency sparkline"
            >
              {sets.map((pieces, i) => (
                <div key={i} className={`ly-collage__set${i === 0 ? " is-on" : ""}`} aria-hidden={i !== 0}>
                  {pieces}
                </div>
              ))}
            </div>
          ) : (
            <div className="ly-collage span-6 start-4" role="img" aria-label="No monitors yet">
              <div className="ly-collage__set is-on">
                <div className="ly-piece pc-bigstat" style={{ left: "10%", top: "20%", width: "80%" }}>
                  <span className="num">0</span>
                  <span className="cap">monitors watching — the fleet is empty</span>
                </div>
              </div>
            </div>
          )}
          <div className="span-3 start-10 hero__cta">
            <a className="btn btn--primary btn--xl" href="/monitors/new">
              Add a monitor
              <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                <path className="m-arrow__stem" d="M1 6h8" />
                <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
              </svg>
            </a>
          </div>
        </div>
        {/* the dealt moment (marquee-row): the fleet's hosts, docked as the hero's last row */}
        <div className="hero-strip">
          <span className="t-label" aria-hidden="true">Watching</span>
          <div data-moment="marquee-row" data-moment-opts='{"speed": 36}'>
            <ul className="mo-mq__track">
              {monitors.length > 0 ? (
                monitors.map((m) => <li key={m.id}>{m.host} · {STATUS_LABEL[m.last_status]}</li>)
              ) : (
                <li>No hosts yet</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
