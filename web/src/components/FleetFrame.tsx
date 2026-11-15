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
  const [openId, setOpenId] = useState<number | null>(selected?.monitor.id ?? null);
  const [openChecks, setOpenChecks] = useState<Check[]>(selected?.checks ?? []);
  const prevStatus = useRef<Map<number, MonitorStatus>>(new Map(initial.monitors.map((m) => [m.id, m.last_status])));
  const checksCache = useRef<Map<number, Check[]>>(
    new Map(selected ? [[selected.monitor.id, selected.checks]] : []),
  );
  const openIdRef = useRef<number | null>(openId);
  const seq = useRef(0);

  useEffect(() => {
    setFleet(initial);
  }, [initial]);

  useEffect(() => {
    setOpenId(selected?.monitor.id ?? null);
    setOpenChecks(selected?.checks ?? []);
    if (selected) checksCache.current.set(selected.monitor.id, selected.checks);
  }, [selected]);

  const loadChecks = useCallback(async (id: number) => {
    const hit = checksCache.current.get(id);
    if (hit) {
      setOpenChecks(hit);
      return;
    }
    try {
      const res = await fetch(`/api/console/monitors/${id}/checks?per_page=40`, { cache: "no-store" });
      if (!res.ok) return;
      const page = await res.json();
      const list: Check[] = Array.isArray(page?.data) ? page.data : [];
      checksCache.current.set(id, list);
      if (openIdRef.current === id) setOpenChecks(list);
    } catch {
      /* the pane keeps its previous checks until the next pick or poll */
    }
  }, []);

  const pick = useCallback(
    (id: number) => {
      openIdRef.current = id;
      setOpenId(id);
      history.pushState(null, "", `/?m=${id}#fleet`);
      loadChecks(id);
    },
    [loadChecks],
  );

  useEffect(() => {
    const onPop = () => {
      const v = Number(new URLSearchParams(location.search).get("m"));
      if (Number.isInteger(v) && v > 0) {
        openIdRef.current = v;
        setOpenId(v);
        loadChecks(v);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [loadChecks]);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/console/fleet", { cache: "no-store" });
      if (!res.ok) return;
      const next: Fleet = await res.json();
      setFleet(next);
      const oid = openIdRef.current;
      if (oid) {
        checksCache.current.delete(oid);
        fetch(`/api/console/monitors/${oid}/checks?per_page=40`, { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((page) => {
            const list: Check[] | null = Array.isArray(page?.data) ? page.data : null;
            if (list) {
              checksCache.current.set(oid, list);
              if (openIdRef.current === oid) setOpenChecks(list);
            }
          })
          .catch(() => {});
      }
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

  const openMonitor = fleet.monitors.find((m) => m.id === openId) ?? null;

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
        <div
          className="panel fleet-shell"
          data-fx="gradient-mesh"
          data-fx-seed="17"
          data-fx-palette='{"bg":"#c6d3df","surface":"#d6e0e9","ink":"#25303a","muted":"#5d6873","accent":"#3f6a92"}'
          data-fx-params='{"speed":0,"calm":0.2,"calmX":0.5,"calmY":0.6,"tint":0.5,"relief":0.3}'
        >
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
                            className={`ui-win__hit${openId === m.id ? " is-open" : ""}`}
                            onClick={(e) => {
                              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                              e.preventDefault();
                              pick(m.id);
                            }}
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
            {openMonitor ? (
              <div className="ui-panel fleet__open">
                <div className="fleet__pick">
                  <label htmlFor="pick-m">Monitor</label>
                  <select
                    id="pick-m"
                    value={openMonitor.id}
                    onChange={(e) => pick(Number(e.currentTarget.value))}
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
                    <p className="fleet__openname">{openMonitor.name}</p>
                    <p className="t-small muted mono">
                      {openMonitor.http_method} {openMonitor.host} · every{" "}
                      {intervalLabel(openMonitor.interval_seconds)}
                    </p>
                  </div>
                  <StatusPill status={openMonitor.active ? openMonitor.last_status : "pending"} />
                </div>

                <dl className="fleet__stats">
                  <div>
                    <dt>Up 24 h</dt>
                    <dd>{uptimeLabel(openMonitor.uptime_24h)}</dd>
                  </div>
                  <div>
                    <dt>Up 30 d</dt>
                    <dd>{uptimeLabel(openMonitor.uptime_30d)}</dd>
                  </div>
                  <div>
                    <dt>Expected</dt>
                    <dd>HTTP {openMonitor.expected_status}</dd>
                  </div>
                  <div>
                    <dt>{openMonitor.consecutive_failures > 0 ? "Fail streak" : "Warn above"}</dt>
                    <dd>
                      {openMonitor.consecutive_failures > 0
                        ? `${openMonitor.consecutive_failures} in a row`
                        : openMonitor.warn_latency_ms
                          ? `${openMonitor.warn_latency_ms} ms`
                          : "off"}
                    </dd>
                  </div>
                </dl>

                {openChecks.length === 0 ? (
                  <p className="t-small muted" style={{ borderTop: "1px solid var(--u-line)", paddingTop: "var(--s-3)" }}>
                    {openMonitor.active
                      ? "No checks yet — the first probe runs on the next scheduled sweep."
                      : "Paused — no checks run until the monitor resumes."}
                  </p>
                ) : openChecks.some((c) => c.latency_ms != null) ? (
                  <div className="fleet__strip">
                    <div className="fleet__striphead">
                      <span className="t-small muted">Latency</span>
                      <span className="t-small muted mono">
                        last {Math.min(openChecks.length, 40)} checks
                        {openMonitor.warn_latency_ms ? ` · degrade above ${openMonitor.warn_latency_ms} ms` : ""}
                      </span>
                    </div>
                    <Sparkline checks={openChecks} warnMs={openMonitor.warn_latency_ms} />
                  </div>
                ) : (
                  <div className="fleet__strip">
                    <div className="fleet__striphead">
                      <span className="t-small muted">Probe strip</span>
                      <span className="t-small muted mono">
                        last {Math.min(openChecks.length, 40)} checks
                      </span>
                    </div>
                    <UptimeStrip checks={openChecks} />
                  </div>
                )}

                <ul className="fleet__checks">
                  {openChecks.slice(0, 5).map((c) => (
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
                  <a className="link" href={`/monitors/${openMonitor.id}`}>
                    Check history
                  </a>
                  <a className="link" href={`/monitors/${openMonitor.id}/edit`}>
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
                    value=""
                    onChange={(e) => {
                      if (e.currentTarget.value) pick(Number(e.currentTarget.value));
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
          </div>
      )}
    </>
  );
}
