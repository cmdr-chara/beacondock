import FleetHero from "@/components/FleetHero";
import FleetFrame from "@/components/FleetFrame";
import { getStatus, listChecks, listMonitors } from "@/lib/api";
import { getPrefs, listAlertRules } from "@/lib/store";
import type { Check, Monitor } from "@/lib/types";

// The console's first screen: dealt hero (triptych, live monitor cards), the
// hosts marquee, then the fleet section on the one ground (bg-field).
export default async function Home({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const [statusRes, monitorsRes, { prefs }, { rules }] = await Promise.all([
    getStatus(),
    listMonitors(),
    getPrefs(),
    listAlertRules(),
  ]);

  const status = statusRes.ok ? statusRes.data : null;
  const monitors = monitorsRes.ok ? monitorsRes.data : [];

  // One page of checks per monitor feeds the hero collage and the latency column.
  const perMonitor = await Promise.all(
    monitors.map(async (m: Monitor) => {
      const r = await listChecks(String(m.id), 1, 14);
      return [m.id, r.ok ? r.data.data : []] as const;
    })
  );
  const checksById = new Map<number, Check[]>(perMonitor);
  const latency = Object.fromEntries(
    perMonitor.map(([id, checks]) => [id, checks.find((c) => c.latency_ms != null)?.latency_ms ?? null])
  );

  // The open pane: the monitor named in ?m=, else the one needing attention first.
  const { m } = await searchParams;
  const rank = { down: 0, degraded: 1, pending: 2, up: 3 } as const;
  const wanted = Number(m);
  const selectedMonitor =
    monitors.find((x) => x.id === wanted) ??
    [...monitors].sort((a, b) => rank[a.last_status] - rank[b.last_status] || a.name.localeCompare(b.name))[0] ??
    null;
  let selected: { monitor: Monitor; checks: Check[] } | null = null;
  if (selectedMonitor) {
    const r = await listChecks(String(selectedMonitor.id), 1, 12);
    selected = { monitor: selectedMonitor, checks: r.ok ? r.data.data : [] };
  }

  return (
    <>
      <FleetHero monitors={monitors} checksById={checksById} status={status} />
      <section className="section bg-field bg-bleed" id="fleet" aria-labelledby="fleet-h">
        <div className="wrap">
          <div className="grid">
            <div className="span-5">
              <span className="t-label">Fleet</span>
              <h2 id="fleet-h">Every target, worst first</h2>
              <p className="t-lead">
                The list is the check pipeline&apos;s ledger — paused and pending monitors sit in the same table as live
                ones.
              </p>
              <p className="t-small muted" style={{ marginTop: "var(--s-4)" }}>
                Refreshes every {prefs.refreshSeconds || "—"} s{prefs.refreshSeconds ? "" : " when set"} · hosts shown,
                never full URLs
              </p>
            </div>
            <div className="span-7 start-6">
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
          </div>
        </div>
      </section>
    </>
  );
}
