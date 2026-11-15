import { PrefsPanel, RulesPanel } from "@/components/SettingsClient";
import { apiBaseUrl, apiConfigured, listMonitors } from "@/lib/api";
import { getPrefs, listAlertRules, mongoOk } from "@/lib/store";

export const metadata = { title: "Console settings: BeaconDock" };
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
    <section className="section section--hero" aria-labelledby="set-h">
      <div className="wrap">
        <div className="grid">
          <div className="span-4">
            <span className="t-label muted">Console</span>
            <h1 id="set-h">Console settings</h1>
            <p className="t-lead">
              Web-layer settings live in MongoDB for refresh pacing and browser alert banners. Monitors and checks stay
              in the Rails API.
            </p>
            <dl className="kv" style={{ marginTop: "var(--s-5)", display: "grid", gap: "var(--s-2)" }}>
              <div>
                <dt className="t-small muted">API endpoint</dt>
                <dd className="mono t-small">{apiBaseUrl()}</dd>
              </div>
              <div>
                <dt className="t-small muted">API key</dt>
                <dd className="mono t-small">{apiConfigured() ? "configured server-side" : "missing"}</dd>
              </div>
              <div>
                <dt className="t-small muted">MongoDB store</dt>
                <dd className="mono t-small">{ok ? "connected" : "offline (defaults active)"}</dd>
              </div>
            </dl>
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
