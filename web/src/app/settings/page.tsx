import { PrefsPanel, RulesPanel } from "@/components/SettingsClient";
import { listMonitors } from "@/lib/api";
import { getPrefs, listAlertRules, mongoOk } from "@/lib/store";

export const metadata = { title: "Console settings — BeaconDock" };
export const dynamic = "force-dynamic";

export default async function Settings() {
  const [{ prefs }, { rules }, monitorsRes, ok] = await Promise.all([
    getPrefs(),
    listAlertRules(),
    listMonitors(),
    mongoOk(),
  ]);
  const monitors = monitorsRes.ok ? monitorsRes.data : [];

  return (
    <section className="section section--hero bg-topglow" aria-labelledby="set-h">
      <div className="wrap">
        <div className="grid">
          <div className="span-4">
            <span className="t-label">Console</span>
            <h1 id="set-h">Settings</h1>
            <p className="t-lead">
              Web-layer settings live in MongoDB — refresh pacing and the rules that flag status changes in this
              console. The API keeps its own records; nothing here touches checks or incidents.
            </p>
            <p className="t-small muted" style={{ marginTop: "var(--s-4)" }}>
              {ok
                ? "Store connected."
                : "Store offline — settings read as defaults and edits are refused until MongoDB is reachable."}
            </p>
          </div>
          <div className="span-7 start-6" style={{ display: "grid", gap: "var(--s-5)", alignContent: "start" }}>
            <PrefsPanel initial={{ refreshSeconds: prefs.refreshSeconds }} mongoOk={ok} />
            <RulesPanel initial={rules} monitors={monitors.map((m) => ({ id: m.id, name: m.name }))} mongoOk={ok} />
          </div>
        </div>
      </div>
    </section>
  );
}
