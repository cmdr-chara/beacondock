"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AlertRule } from "@/lib/store";
import type { Check, Monitor, MonitorStatus, StatusSummary } from "@/lib/types";
import { intervalLabel, latencyLabel, STATUS_LABEL, timeAgo, uptimeLabel } from "@/lib/format";
import { Sparkline, StatusPill, UptimeStrip } from "./StatusBits";

type Filter = MonitorStatus | "all";

interface Fleet {
  status: StatusSummary | null;
  monitors: Monitor[];
  latency: Record<number, number | null>;
  offline: boolean;
}

// Unified two-pane console window: shared bar across both panes, status-dot
// monitor rows on the left, aligned metrics + check history on the right.
export default function FleetFrame({
  initial,
  selected,
  refreshSeconds,
  alertRules,
}: {
  initial: Fleet;
  selected: { monitor: Monitor; checks: Check[] } | null;
  refreshSeconds: number;
  alertRules: AlertRule[];
}) {
  const [fleet, setFleet] = useState<Fleet>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [banner, setBanner] = useState<{ id: number; text: string; tone: MonitorStatus }[]>([]);
  const prevStatus = useRef<Map<number, MonitorStatus>>(new Map(initial.monitors.map((m) => [m.id, m.last_status])));
  const seq = useRef(0);

  useEffect(() => {
    setFleet(initial);
  }, [initial]);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/console/fleet", { cache: "no-store" });
      if (!res.ok) return;
      const next: Fleet = await res.json();
      setFleet(next);
      for (const m of next.monitors) {
        const was = prevStatus.current.get(m.id);
        if (was && was !== m.last_status) {
          const hit = alertRules.find(
            (r) => (r.monitorId === null || r.monitorId === m.id) && r.event === m.last_status,
          );
          if (hit) {
            setBanner((b) => [
              ...b,
              {
                id: ++seq.current,
                text: `${m.name} became ${STATUS_LABEL[m.last_status].toLowerCase()}`,
                tone: m.last_status,
              },
            ]);
          }
        }
        prevStatus.current.set(m.id, m.last_status);
      }
    } catch {
      /* a failed poll is not a healthy observation; the last frame stands */
    }
  }, [alertRules]);

  useEffect(() => {
    if (!refreshSeconds) return;
    const t = setInterval(poll, refreshSeconds * 1000);
    return () => clearInterval(t);
  }, [poll, refreshSeconds]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: fleet.monitors.length, pending: 0, up: 0, down: 0, degraded: 0 };
    for (const m of fleet.monitors) c[m.last_status]++;
    return c;
  }, [fleet.monitors]);

  const rows = useMemo(() => {
    const rank: Record<MonitorStatus, number> = { down: 0, degraded: 1, pending: 2, up: 3 };
    return fleet.monitors
      .filter((m) => filter === "all" || m.last_status === filter)
      .sort((a, b) => rank[a.last_status] - rank[b.last_status] || a.name.localeCompare(b.name));
  }, [fleet.monitors, filter]);

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "down", label: "Down" },
    { id: "degraded", label: "Degraded" },
    { id: "pending", label: "Pending" },
    { id: "up", label: "Up" },
  ];

  return (
    <>
      {banner.map((b) => (
        <div key={b.id} className={`alert-banner st-${b.tone}`} role="status">
          <span className="st-dot" style={{ background: "currentColor" }} aria-hidden="true" />
          <span>{b.text}</span>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            aria-label="Dismiss"
            onClick={() => setBanner((x) => x.filter((r) => r.id !== b.id))}
          >
            Dismiss
          </button>
        </div>
      ))}
      {fleet.offline ? (
        <div className="fleet__empty ui-panel" style={{ padding: "var(--s-6)" }}>
          <h3>The API did not answer</h3>
          <p>
            The console reads the BeaconDock REST API. Set <code>BEACONDOCK_API_URL</code> and{" "}
            <code>BEACONDOCK_API_KEY</code> in <code>.env.local</code>, then restart the console.
          </p>
        </div>
      ) : (
        <div className="ui app fleet">
          <div className="ui-win__bar app__bar">
            <span className="ui-win__crumb">
              BeaconDock <i>/</i> <b>Fleet</b>
            </span>
            <span className="ui-spacer"></span>
            <span className="ui-win__age">
              {fleet.status
                ? `${fleet.status.counts.up} up · ${fleet.status.counts.down} down · ${fleet.status.total} total`
                : "—"}
            </span>
          </div>

          <div className="app__pane app__pane--list">
            <div className="ui-panel ui-win" data-ui="window">
              <div className="ui-win__body">
                <nav className="ui-win__side" aria-label="Filter by status">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`ui-win__nav${filter === f.id ? " is-on" : ""}`}
                      onClick={() => setFilter(f.id)}
                    >
                      {f.id === "all" ? (
                        <span className="ui-win__hash" aria-hidden="true">
                          ≡
                        </span>
                      ) : (
                        <span className={`st-dot st-${f.id}`} aria-hidden="true" />
                      )}
                      {f.label}
                      <em>{counts[f.id]}</em>
                    </button>
                  ))}
                </nav>
                <div className="ui-win__main">
                  <div className="ui-win__cols fleet__cols" aria-hidden="true">
                    <span>Monitor</span>
                    <span>Status</span>
                    <span>Checked</span>
                  </div>
                  {rows.length === 0 ? (
                    <div className="fleet__empty">
                      <h3>{fleet.monitors.length === 0 ? "No monitors yet" : "Nothing in this state"}</h3>
                      <p>
                        {fleet.monitors.length === 0
                          ? "The API checks HTTP endpoints on a schedule and opens an incident after two consecutive failures."
                          : "The filter on the left shows every state the fleet can take."}
                      </p>
                      {fleet.monitors.length === 0 ? (
                        <p>
                          <a className="btn btn--primary" href="/monitors/new">
                            Add a monitor
                            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                              <path className="m-arrow__stem" d="M1 6h8" />
                              <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
                            </svg>
                          </a>
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <ul className="ui-win__rows">
                      {rows.map((m) => (
                        <li key={m.id} className="ui-win__row" data-row>
                          <a
                            href={`/?m=${m.id}#fleet`}
                            className={`ui-win__hit${selected?.monitor.id === m.id ? " is-open" : ""}`}
                          >
                            <span className={`st-dot st-${m.last_status}`} aria-hidden="true" />
                            <span className="ui-win__who">{m.name}</span>
                            <span className="ui-win__sub">
                              {m.host}
                              {!m.active ? " · paused" : ""}
                            </span>
                            <span className={`ui-win__st st-${m.last_status}`}>{STATUS_LABEL[m.last_status]}</span>
                            <span className="ui-win__age" suppressHydrationWarning>
                              {timeAgo(m.last_checked_at)}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="app__pane app__pane--open">
            {selected ? (
              <div className="ui-panel fleet__open">
                <div className="fleet__pick">
                  <label htmlFor="pick-m">Monitor</label>
                  <select
                    id="pick-m"
                    defaultValue={selected.monitor.id}
                    onChange={(e) => {
                      location.href = `/?m=${e.currentTarget.value}#fleet`;
                    }}
                  >
                    {fleet.monitors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fleet__openhead">
                  <div>
                    <p className="fleet__openname">{selected.monitor.name}</p>
                    <p className="t-small muted mono">
                      {selected.monitor.http_method} {selected.monitor.host} · every{" "}
                      {intervalLabel(selected.monitor.interval_seconds)}
                    </p>
                  </div>
                  <StatusPill status={selected.monitor.active ? selected.monitor.last_status : "pending"} />
                </div>

                <dl className="fleet__stats">
                  <div>
                    <dt>Up 24 h</dt>
                    <dd>{uptimeLabel(selected.monitor.uptime_24h)}</dd>
                  </div>
                  <div>
                    <dt>Up 30 d</dt>
                    <dd>{uptimeLabel(selected.monitor.uptime_30d)}</dd>
                  </div>
                  <div>
                    <dt>Expected</dt>
                    <dd>HTTP {selected.monitor.expected_status}</dd>
                  </div>
                  <div>
                    <dt>{selected.monitor.consecutive_failures > 0 ? "Fail streak" : "Warn above"}</dt>
                    <dd>
                      {selected.monitor.consecutive_failures > 0
                        ? `${selected.monitor.consecutive_failures} in a row`
                        : selected.monitor.warn_latency_ms
                          ? `${selected.monitor.warn_latency_ms} ms`
                          : "off"}
                    </dd>
                  </div>
                </dl>

                {selected.checks.some((c) => c.latency_ms != null) ? (
                  <Sparkline checks={selected.checks} warnMs={selected.monitor.warn_latency_ms} />
                ) : (
                  <div className="fleet__strip">
                    <div className="fleet__striphead">
                      <span className="t-small muted">Probe strip</span>
                      <span className="t-small muted mono">
                        last {Math.min(selected.checks.length, 40)} checks
                      </span>
                    </div>
                    <UptimeStrip checks={selected.checks} />
                  </div>
                )}

                <ul className="fleet__checks">
                  {selected.checks.slice(0, 5).map((c) => (
                    <li key={c.id} className="fleet__checkrow">
                      <span className={`st-dot st-${c.status}`} aria-hidden="true" />
                      <time dateTime={c.checked_at}>
                        {new Date(c.checked_at).toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" })}
                      </time>
                      <span className="fleet__checkmsg">
                        {c.error ?? (c.http_status ? `HTTP ${c.http_status}` : "no reply")}
                      </span>
                      <span className={`fleet__checkval st-${c.status}`} style={{ color: "var(--st)" }}>
                        {c.latency_ms != null ? latencyLabel(c.latency_ms) : STATUS_LABEL[c.status]}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="fleet__foot">
                  <a className="link" href={`/monitors/${selected.monitor.id}`}>
                    Check history
                  </a>
                  <a className="link" href={`/monitors/${selected.monitor.id}/edit`}>
                    Edit monitor
                  </a>
                </div>
              </div>
            ) : (
              <div className="fleet__empty">
                <h3>Pick a monitor</h3>
                <p>Its recent checks and latency open here. On a phone this pane is the whole frame.</p>
                <div className="fleet__pick">
                  <label htmlFor="pick-any">Monitor</label>
                  <select
                    id="pick-any"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.currentTarget.value) location.href = `/?m=${e.currentTarget.value}#fleet`;
                    }}
                  >
                    <option value="" disabled>
                      Choose…
                    </option>
                    {fleet.monitors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
