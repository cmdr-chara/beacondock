import { notFound } from "next/navigation";
import ChecksTable from "@/components/ChecksTable";
import { DeleteMonitor } from "@/components/MonitorActions";
import { Sparkline, StatusPill, UptimeStrip } from "@/components/StatusBits";
import { getMonitor, listChecks } from "@/lib/api";
import { intervalLabel, timeAgo, uptimeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MonitorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) notFound();
  const monitorRes = await getMonitor(id);
  if (!monitorRes.ok) notFound();
  const monitor = monitorRes.data;
  const checksRes = await listChecks(id, 1, 20);
  const checks = checksRes.ok
    ? checksRes.data
    : { data: [], meta: { page: 1, per_page: 20, total_count: 0, total_pages: 1 } };

  return (
    <>
      <section className="section section--hero" aria-labelledby="m-name">
        <div className="wrap">
          <div className="grid">
            <div className="span-7 stack-4">
              <p className="hero-notice">
                <StatusPill status={monitor.active ? monitor.last_status : "pending"} />
                {!monitor.active ? <span className="t-small muted"> paused — no checks running</span> : null}
              </p>
              <h1 id="m-name">{monitor.name}</h1>
              <p className="t-lead">
                <span className="mono">{monitor.http_method}</span> {monitor.host} · every{" "}
                {intervalLabel(monitor.interval_seconds)} · expects {monitor.expected_status}
              </p>
              <div style={{ marginTop: "var(--s-6)", maxWidth: "460px" }}>
                <p className="t-small muted" style={{ marginBottom: "var(--s-2)" }}>
                  Recent probe strip
                </p>
                <UptimeStrip checks={checks.data} />
              </div>
            </div>
            <div className="span-5 start-8">
              <dl className="statline">
                <div>
                  <dt>Up 24 h</dt>
                  <dd>{uptimeLabel(monitor.uptime_24h)}</dd>
                </div>
                <div>
                  <dt>Up 30 d</dt>
                  <dd>{uptimeLabel(monitor.uptime_30d)}</dd>
                </div>
                <div>
                  <dt>Failures in a row</dt>
                  <dd>{monitor.consecutive_failures}</dd>
                </div>
                <div>
                  <dt>Last checked</dt>
                  <dd>{timeAgo(monitor.last_checked_at)}</dd>
                </div>
              </dl>
              <div className="btn-row" style={{ marginTop: "var(--s-6)" }}>
                <a className="btn btn--primary" href={`/monitors/${monitor.id}/edit`}>
                  Edit the monitor
                  <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                    <path className="m-arrow__stem" d="M1 6h8" />
                    <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
                  </svg>
                </a>
                <DeleteMonitor id={monitor.id} name={monitor.name} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section ground-surface" aria-labelledby="checks-h">
        <div className="wrap">
          <div className="grid">
            <div className="span-4">
              <span className="t-label muted">History</span>
              <h2 id="checks-h">Check history, newest first</h2>
              <p className="t-lead">
                Kept 30 days. Two consecutive failures open an incident; a cancelled check never counts as healthy.
              </p>
            </div>
            <div className="span-8 start-5">
              <div className="ui-panel" style={{ padding: "var(--s-5)", marginBottom: "var(--s-5)" }}>
                <h3 className="t-label muted" style={{ marginBottom: "var(--s-3)" }}>
                  Latency · last {Math.min(checks.data.length, 60)} checks
                  {monitor.warn_latency_ms ? ` · degrade above ${monitor.warn_latency_ms} ms` : ""}
                </h3>
                <Sparkline checks={checks.data} warnMs={monitor.warn_latency_ms} />
              </div>
              <ChecksTable monitorId={monitor.id} initial={checks} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
