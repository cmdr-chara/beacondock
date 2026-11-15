"use client";

import { useState } from "react";

// Delete with an explicit two-step confirm, then back to the fleet.
export function DeleteMonitor({ id, name }: { id: number; name: string }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function remove() {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/console/monitors/${id}`, { method: "DELETE" });
    if (res.ok) {
      location.href = "/";
    } else {
      const body = await res.json().catch(() => null);
      setErr(body?.error ?? "The API refused the delete.");
      setBusy(false);
      setArmed(false);
    }
  }

  if (!armed) {
    return (
      <button className="btn btn--danger" type="button" onClick={() => setArmed(true)}>
        Remove {name}
      </button>
    );
  }
  return (
    <span style={{ display: "inline-flex", gap: "var(--s-2)", alignItems: "center" }}>
      <button className="btn btn--danger" type="button" disabled={busy} onClick={remove}>
        {busy ? "Removing…" : "Yes, remove it"}
      </button>
      <button className="btn btn--secondary" type="button" disabled={busy} onClick={() => setArmed(false)}>
        Keep it
      </button>
      {err ? (
        <span className="t-small st-down" role="alert" style={{ color: "var(--st)" }}>
          {err}
        </span>
      ) : null}
    </span>
  );
}
