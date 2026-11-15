"use client";

import { useCallback, useState } from "react";
import type { ChecksPage } from "@/lib/types";
import { httpStatusLabel, latencyLabel, STATUS_LABEL } from "@/lib/format";

// Paginated check history — a window pane of its own under the monitor head.
export default function ChecksTable({ monitorId, initial }: { monitorId: number; initial: ChecksPage }) {
  const [page, setPage] = useState(initial.meta.page);
  const [data, setData] = useState(initial);

  const load = useCallback(
    async (p: number) => {
      const res = await fetch(`/api/console/monitors/${monitorId}/checks?page=${p}`, { cache: "no-store" });
      if (!res.ok) return;
      setData(await res.json());
      setPage(p);
    },
    [monitorId],
  );

  return (
    <>
      {data.data.length === 0 ? (
        <div className="fleet__empty">
          <h3>No checks yet</h3>
          <p>The first check lands on the next scheduled run of the jobs worker.</p>
        </div>
      ) : (
        <table className="mtable">
          <thead>
            <tr>
              <th>Checked</th>
              <th>Result</th>
              <th className="m-hide-sm">HTTP</th>
              <th>Latency</th>
              <th className="m-hide-md">Error</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="m-num">
                    {new Date(c.checked_at).toLocaleString("en-GB", { hour12: false, timeZone: "UTC" })}
                  </span>
                </td>
                <td>
                  <span className={`st-pill st-${c.status}`}>
                    <span className="st-dot" style={{ background: "currentColor" }} />
                    {STATUS_LABEL[c.status]}
                  </span>
                </td>
                <td className="m-hide-sm">
                  <span className="m-num">{httpStatusLabel(c.http_status)}</span>
                </td>
                <td>
                  <span className="m-num">{latencyLabel(c.latency_ms)}</span>
                </td>
                <td className="m-hide-md">
                  <span className="t-small muted">{c.error ?? "—"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data.meta.total_pages > 1 ? (
        <div className="btn-row" style={{ marginTop: "var(--s-4)" }}>
          <button className="btn btn--secondary" type="button" disabled={page <= 1} onClick={() => load(page - 1)}>
            Newer checks
          </button>
          <span className="t-small muted" style={{ alignSelf: "center" }}>
            page {data.meta.page} of {data.meta.total_pages}
          </span>
          <button
            className="btn btn--secondary"
            type="button"
            disabled={page >= data.meta.total_pages}
            onClick={() => load(page + 1)}
          >
            Older checks
          </button>
        </div>
      ) : null}
    </>
  );
}
