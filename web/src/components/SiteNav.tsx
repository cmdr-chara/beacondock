import { getStatus } from "@/lib/api";

const CHEV = (
  <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M3 4.5l3 3 3-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// nav-cards: one word opens a flat panel with three UI preview cards (410 wide each).
export default async function SiteNav() {
  const status = await getStatus();
  const summary = status.ok
    ? `${status.data.counts.up} up · ${status.data.counts.down} down · ${status.data.open_incidents} open`
    : "Connect Rails API on :3000";

  return (
    <header className="nav">
      <div className="wrap nav__bar">
        <a className="skip-link" href="#top">
          Skip to content
        </a>
        <a className="nav__logo" href="/" aria-label="BeaconDock console">
          <span className="mark" data-mark="stack" aria-hidden="true"></span>
          BeaconDock
        </a>
        <nav className="nav__links" aria-label="Main">
          <div className="nav__item">
            <a className="nav__link" href="/#fleet">
              Console {CHEV}
            </a>
            <div className="nav__menu">
              <div className="wrap grid">
                <a className="menu-card span-4" href="/#fleet">
                  <div className="panel" style={{ "--p-h": "200px" } as React.CSSProperties}>
                    <div className="stage stage--fade-br">
                      <div
                        className="at-corner"
                        style={{ "--ax": "24px", "--ay": "24px" } as React.CSSProperties}
                      >
                        <div className="ui ui-panel ui-win ui-win--compact" aria-hidden="true">
                          <div className="ui-win__bar">
                            <span className="ui-dots"><i></i><i></i><i></i></span>
                            <span className="ui-win__crumb">BeaconDock <i>/</i> <b>Fleet</b></span>
                          </div>
                          <ul className="ui-win__rows">
                            <li className="ui-win__row">
                              <span className="ui-avatar" data-tone="5">SB</span>
                              <span className="ui-win__who">staging: billing</span>
                              <span className="ui-win__sub">127.0.0.1</span>
                              <span className="ui-win__st st-down">Down</span>
                            </li>
                            <li className="ui-win__row">
                              <span className="ui-avatar" data-tone="3">AG</span>
                              <span className="ui-win__who">api.github.com</span>
                              <span className="ui-win__sub">api.github.com</span>
                              <span className="ui-win__st st-up">Up</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="t-card">Fleet ledger</span>
                  <span className="t-small muted">{summary}</span>
                </a>
                <a className="menu-card span-4" href="/#checks">
                  <div className="panel" style={{ "--p-h": "200px" } as React.CSSProperties}>
                    <div className="stage stage--fade-br">
                      <div
                        className="at-corner"
                        style={{ "--ax": "24px", "--ay": "24px" } as React.CSSProperties}
                      >
                        <div className="ui ui-notify" aria-hidden="true">
                          <ul className="ui-notify__list">
                            <li className="ui-note">
                              <span className="ui-agent ui-note__av"></span>
                              <span className="ui-note__text">
                                <span className="ui-note__title">Incident opened<time>now</time></span>
                                <span className="ui-note__body">2 consecutive failures on staging</span>
                              </span>
                            </li>
                            <li className="ui-note">
                              <span className="ui-note__ico">
                                <svg className="ui-icon" viewBox="0 0 16 16"><path d="m3.5 8.4 2.8 2.8 6.2-6.4" /></svg>
                              </span>
                              <span className="ui-note__text">
                                <span className="ui-note__title">Incident resolved<time>14m</time></span>
                                <span className="ui-note__body">internal: app /up answered 200</span>
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="t-card">Check pipeline</span>
                  <span className="t-small muted">Intervals 30 s to 1 h, 2-failure threshold</span>
                </a>
                <a className="menu-card span-4" href="/settings">
                  <div className="panel" style={{ "--p-h": "200px" } as React.CSSProperties}>
                    <div className="stage stage--fade-br">
                      <div
                        className="at-corner"
                        style={{ "--ax": "24px", "--ay": "24px" } as React.CSSProperties}
                      >
                        <div className="ui ui-panel ui-toggles" aria-hidden="true">
                          <div className="ui-head">
                            <div className="ui-title">Console settings</div>
                            <span className="ui-spacer"></span>
                            <div className="ui-meta">15 s poll</div>
                          </div>
                          <ul className="ui-toggles__list">
                            <li className="ui-tg">
                              <span className="ui-tg__text">
                                <span className="ui-tg__label">Flag down transitions</span>
                                <span className="ui-tg__sub">Show banner in console</span>
                              </span>
                              <span className="ui-switch is-on"><i></i></span>
                            </li>
                            <li className="ui-tg">
                              <span className="ui-tg__text">
                                <span className="ui-tg__label">Auto-refresh fleet</span>
                                <span className="ui-tg__sub">Polls /api/console/fleet</span>
                              </span>
                              <span className="ui-switch is-on"><i></i></span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="t-card">Console settings</span>
                  <span className="t-small muted">Refresh pacing and browser alert rules</span>
                </a>
              </div>
            </div>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="/#fleet">
              Fleet
            </a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="/#checks">
              Pipeline
            </a>
          </div>
          <div className="nav__item">
            <a className="nav__link" href="/#workflow">
              Workflow
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
