// footer.closing: footer-dark (ground-inverse) + close-type (full-width primary CTA).
export default function SiteFooter() {
  return (
    <footer className="footer closing footer--dark ground-inverse" id="console-foot" aria-labelledby="close-h">
      <div className="wrap">
        <div className="closing__cta close--type">
          <div className="section-head">
            <h2 id="close-h">Add a monitor to the fleet</h2>
            <p>First check runs on the next Solid Queue sweep; incidents open after two consecutive failures.</p>
          </div>
          <a className="btn btn--primary btn--xl btn--wide" href="/monitors/new">
            Add a monitor
            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
              <path className="m-arrow__stem" d="M1 6h8" />
              <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
          </a>
        </div>
        <div className="closing__links">
          <div className="grid">
            <div className="span-4 stack-4">
              <a className="footer__mark" href="/">
                <span className="mark" data-mark="stack" aria-hidden="true"></span>
                BeaconDock
              </a>
              <p className="t-small muted">Self-hosted HTTP uptime monitoring.</p>
            </div>
            <div className="span-2 footer__col">
              <h3>Console</h3>
              <ul>
                <li>
                  <a href="/#fleet">Fleet ledger</a>
                </li>
                <li>
                  <a href="/monitors/new">Add a monitor</a>
                </li>
                <li>
                  <a href="/settings">Settings</a>
                </li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Pipeline</h3>
              <ul>
                <li>
                  <a href="/#checks">Check cycle</a>
                </li>
                <li>
                  <a href="/#statement">Incident rule</a>
                </li>
                <li>
                  <a href="/#stack">Architecture</a>
                </li>
              </ul>
            </div>
            <div className="span-2 footer__col">
              <h3>Workflow</h3>
              <ul>
                <li>
                  <a href="/#workflow">Terminal and API</a>
                </li>
                <li>
                  <a href="/#faq">Questions</a>
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
              </ul>
            </div>
          </div>
          <div className="footer__legal">
            <span>&copy; 2026 BeaconDock</span>
            <span className="credits-line">Product names and logos are trademarks of their owners.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
