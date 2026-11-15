import { getStatus } from "@/lib/api";

const CHEV = (
  <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// nav-mega: one word opens a flat panel (link columns and one menu card).
export default async function SiteNav() {
  const status = await getStatus();
  const summary = status.ok
    ? `${status.data.counts.up} up · ${status.data.counts.down} down · ${status.data.open_incidents} open`
    : "API offline";

  return (
    <header className="nav">
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          Skip to content
        </a>
        <a className="nav__logo" href="/" aria-label="BeaconDock console">
          <span className="mark" data-mark="dots" aria-hidden="true"></span>
          BeaconDock
        </a>
        <nav className="nav__links" aria-label="Main">
          <div className="nav__item">
            <a className="nav__link" href="/">
              Console {CHEV}
            </a>
            <div className="nav__menu">
              <div className="wrap grid">
                <div className="menu-col span-3">
                  <p className="t-label">Fleet</p>
                  <a href="/">
                    Dashboard<span>Every monitor, worst first</span>
                  </a>
                  <a href="/monitors/new">
                    New monitor<span>Watch another endpoint</span>
                  </a>
                </div>
                <div className="menu-col span-3">
                  <p className="t-label">Console</p>
                  <a href="/settings">
                    Settings<span>Refresh, pager, alert rules</span>
                  </a>
                </div>
                <a className="menu-card span-3 start-10" href="/settings">
                  <div className="panel">
                    <div className="pc-monitor" style={{ height: "100%" }}>
                      <h4>Fleet right now</h4>
                      <div className="pc-host">{summary}</div>
                      <div className="pc-row">
                        <span className="pc-stat">{status.ok ? status.data.total : "—"} monitors</span>
                      </div>
                    </div>
                  </div>
                  <span className="t-card">Live from the API</span>
                  <span className="t-small muted">Counts refresh on every page</span>
                </a>
              </div>
            </div>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="/">
              Fleet
            </a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="/settings">
              Settings
            </a>
          </div>
        </nav>
        <div className="nav__actions">
          <a className="btn btn--primary" href="/monitors/new">
            Add a monitor
            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
              <path className="m-arrow__stem" d="M1 6h8" />
              <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
          </a>
        </div>
        <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
