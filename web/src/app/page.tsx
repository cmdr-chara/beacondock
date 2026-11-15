import FleetHero from "@/components/FleetHero";
import FleetFrame from "@/components/FleetFrame";
import HomeSections from "@/components/HomeSections";
import { getStatus, listChecks, listMonitors } from "@/lib/api";
import { getPrefs, listAlertRules } from "@/lib/store";
import type { Check, Monitor } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const [statusRes, monitorsRes, { prefs }, { rules }] = await Promise.all([
    getStatus(),
    listMonitors(),
    getPrefs(),
    listAlertRules(),
  ]);

  const status = statusRes.ok ? statusRes.data : null;
  const monitors = monitorsRes.ok ? monitorsRes.data : [];

  const perMonitor = await Promise.all(
    monitors.map(async (m: Monitor) => {
      const r = await listChecks(String(m.id), 1, 14);
      return [m.id, r.ok ? r.data.data : []] as const;
    }),
  );
  const checksById = new Map<number, Check[]>(perMonitor);
  const latency = Object.fromEntries(
    perMonitor.map(([id, checks]) => [id, checks.find((c) => c.latency_ms != null)?.latency_ms ?? null]),
  );

  const { m } = await searchParams;
  const rank = { down: 0, degraded: 1, pending: 2, up: 3 } as const;
  const wanted = Number(m);
  const selectedMonitor =
    monitors.find((x) => x.id === wanted) ??
    [...monitors].sort((a, b) => rank[a.last_status] - rank[b.last_status] || a.name.localeCompare(b.name))[0] ??
    null;
  let selected: { monitor: Monitor; checks: Check[] } | null = null;
  if (selectedMonitor) {
    const r = await listChecks(String(selectedMonitor.id), 1, 40);
    selected = { monitor: selectedMonitor, checks: r.ok ? r.data.data : [] };
  }

  return (
    <>
      <FleetHero monitors={monitors} checksById={checksById} status={status} />
      <section className="section" id="fleet" aria-labelledby="fleet-h">
        <div className="wrap">
          <div className="grid">
            <div className="span-5">
              <h2 id="fleet-h">Monitor uptime, worst first</h2>
            </div>
            <div className="span-6 start-7">
              <p className="t-lead muted">
                Endpoints sort by current state beside 24 h uptime, probe strip, and check history. Refreshes every{" "}
                {prefs.refreshSeconds || "—"} s.
              </p>
              <p style={{ marginTop: "var(--s-3)" }}>
                <a className="link" href="/settings">
                  Configure alert rules
                </a>
              </p>
            </div>
          </div>
          <FleetFrame
            initial={{
              status,
              monitors,
              latency,
              offline: !monitorsRes.ok && !statusRes.ok,
            }}
            selected={selected}
            refreshSeconds={prefs.refreshSeconds}
            alertRules={rules}
          />
        </div>
      </section>
      <HomeSections monitors={monitors} status={status} />
    </>
  );
}
