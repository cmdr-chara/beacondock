// footer.closing: row 1 the dealt close-word (h2 + button, then the name across
// the wrap), row 2 the footer-columns directory and legal row.
export default function SiteFooter() {
  return (
    <footer className="footer closing" id="console-foot" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__cta close--word">
          <div className="grid closing__head">
            <div className="span-5">
              <h2 id="close-h">Watch another endpoint</h2>
              <p className="t-lead">First check runs within the interval you set.</p>
            </div>
            <div className="span-3 start-7 closing__act">
              <a className="btn btn--primary btn--xl" href="/monitors/new">
                Add a monitor
                <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
                  <path className="m-arrow__stem" d="M1 6h8" />
                  <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
                </svg>
              </a>
            </div>
          </div>
          <p className="close__word" aria-hidden="true">
            BeaconDock
          </p>
        </div>
        <div className="closing__links">
          <div className="grid">
            <div className="span-6 stack-4">
              <a className="nav__logo" href="/">
                <span className="mark" data-mark="dots" aria-hidden="true"></span>
                BeaconDock
              </a>
              <p className="footer__lede">Self-hosted uptime monitoring for HTTP endpoints.</p>
            </div>
            <div className="span-2 footer__col">
              <h3>Console</h3>
              <ul>
                <li>
                  <a href="/">Fleet</a>
                </li>
                <li>
                  <a href="/monitors/new">New monitor</a>
                </li>
                <li>
                  <a href="/settings">Settings</a>
                </li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>API</h3>
              <ul>
                <li>
                  <a href="/api/console/status" target="_blank" rel="noreferrer">
                    Status
                  </a>
                </li>
                <li>
                  <a href="/api/console/monitors" target="_blank" rel="noreferrer">
                    Monitors
                  </a>
                </li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Project</h3>
              <ul>
                <li>
                  <a href="https://github.com/cmdr-chara/beacondock" target="_blank" rel="noreferrer">
                    Repository
                  </a>
                </li>
                <li>
                  <a href="#console-foot">Contact</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer__legal">
            <span>&copy; 2026 BeaconDock</span>
            <div className="socials"></div>
            <span className="credits-line">The API key stays on the server; the browser never sees it.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
