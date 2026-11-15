"use client";

import { useState } from "react";
import type { AlertRule } from "@/lib/store";
import type { Monitor, MonitorStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/format";

const REFRESH_CHOICES = [0, 5, 15, 30];

// Console preferences + alert rules — the MongoDB-backed web-layer store.
// When Mongo is unreachable the route answers degrade and edits are refused.
export function PrefsPanel({ initial, mongoOk }: { initial: { refreshSeconds: number }; mongoOk: boolean }) {
  const [refresh, setRefresh] = useState(initial.refreshSeconds);
  const [msg, setMsg] = useState("");

  async function save(v: number) {
    setRefresh(v);
    setMsg("");
    const res = await fetch("/api/console/prefs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshSeconds: v }),
    });
    setMsg(res.ok ? (v === 0 ? "Live refresh off" : `Refreshing every ${v} s`) : "The store is offline — the change was not kept");
  }

  return (
    <div className="ui-panel" style={{ padding: "var(--s-5)" }}>
      <h3 className="t-label" style={{ marginBottom: "var(--s-4)" }}>Fleet table refresh</h3>
      <div className="btn-row" role="group" aria-label="Refresh interval">
        {REFRESH_CHOICES.map((v) => (
          <button
            key={v}
            type="button"
            className={`btn ${refresh === v ? "btn--primary" : "btn--secondary"}`}
            onClick={() => save(v)}
            disabled={!mongoOk}
          >
            {v === 0 ? "Off" : `${v} s`}
          </button>
        ))}
      </div>
      {msg ? <p className="t-small muted" role="status" style={{ marginTop: "var(--s-3)" }}>{msg}</p> : null}
      {!mongoOk ? (
        <p className="t-small" role="status" style={{ marginTop: "var(--s-3)", color: "#f2b134" }}>
          The web-layer store is unreachable — the console still reads and manages monitors.
        </p>
      ) : null}
    </div>
  );
}

export function RulesPanel({
  initial,
  monitors,
  mongoOk,
}: {
  initial: AlertRule[];
  monitors: Pick<Monitor, "id" | "name">[];
  mongoOk: boolean;
}) {
  const [rules, setRules] = useState(initial);
  const [err, setErr] = useState("");

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/console/alert-rules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        monitorId: fd.get("monitorId") === "any" ? null : Number(fd.get("monitorId")),
        event: fd.get("event") as MonitorStatus,
      }),
    });
    if (res.ok) {
      setRules((await res.json()).rules);
      e.currentTarget.reset();
    } else {
      setErr("The rule was not saved — the store may be offline.");
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/console/alert-rules/${id}`, { method: "DELETE" });
    if (res.ok) setRules(rules.filter((r) => r._id !== id));
  }

  const nameOf = (id: number | null) => (id === null ? "any monitor" : monitors.find((m) => m.id === id)?.name ?? `#${id}`);

  return (
    <div className="ui-panel" style={{ padding: "var(--s-5)" }}>
      <h3 className="t-label" style={{ marginBottom: "var(--s-4)" }}>Alert rules</h3>
      <p className="t-small muted" style={{ marginBottom: "var(--s-4)" }}>
        A status line appears over the fleet table when a monitor becomes the chosen state. Incident email still belongs
        to the API.
      </p>
      <form onSubmit={add} className="form">
        <div className="form__row">
          <div className="form__group">
            <label htmlFor="r-monitor">When</label>
            <select id="r-monitor" name="monitorId" defaultValue="any">
              <option value="any">any monitor</option>
              {monitors.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="form__group">
            <label htmlFor="r-event">becomes</label>
            <select id="r-event" name="event" defaultValue="down">
              {(["down", "degraded", "up"] as MonitorStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s].toLowerCase()}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn--primary" type="submit" disabled={!mongoOk}>
          Add the rule
          <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
            <path className="m-arrow__stem" d="M1 6h8" />
            <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
          </svg>
        </button>
      </form>
      {err ? <p className="t-small" role="alert" style={{ color: "#ff4a1f" }}>{err}</p> : null}
      {rules.length > 0 ? (
        <ul style={{ marginTop: "var(--s-4)", display: "grid", gap: "var(--s-2)" }}>
          {rules.map((r) => (
            <li key={r._id} className="statline" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="t-small">
                when <b>{nameOf(r.monitorId)}</b> becomes <b className={`st-${r.event}`}>{STATUS_LABEL[r.event].toLowerCase()}</b>
              </span>
              <button className="btn btn--secondary" type="button" onClick={() => remove(r._id!)}>Remove</button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="t-small muted" style={{ marginTop: "var(--s-4)" }}>No rules yet.</p>
      )}
    </div>
  );
}
