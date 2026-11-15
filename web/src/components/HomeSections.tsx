import { STATUS_LABEL } from "@/lib/format";
import type { Monitor, StatusSummary } from "@/lib/types";

const PIPELINE_DIAGRAM = {
  layout: "fanin",
  alt: "Ruby, Rails, SQLite and MongoDB feed Next.js, which serves the live BeaconDock console.",
  sources: [
    { label: "Ruby 4.0", icon: "ruby", sub: "Worker + TUI" },
    { label: "Rails 8.1", icon: "rails", sub: "/api/v1" },
    { label: "SQLite", icon: "sqlite", sub: "Checks + queue" },
    { label: "MongoDB", icon: "mongodb", sub: "Alert rules" },
  ],
  target: { label: "Next.js", icon: "nextjs" },
  then: { label: "Console", icon: "ui:activity", meta: "live" },
};

export default function HomeSections({
  monitors,
  status,
}: {
  monitors: Monitor[];
  status: StatusSummary | null;
}) {
  const downMon = monitors.find((m) => m.last_status === "down") ?? monitors[0];
  const degradedMon = monitors.find((m) => m.last_status === "degraded") ?? monitors[1];
  const upMon = monitors.find((m) => m.last_status === "up") ?? monitors[0];
  const upCount = status?.counts.up ?? 5;
  const searchList = monitors.slice(0, 3);

  return (
    <>
      {/* features-2x2 on .ground-surface; the dealt scroll transitions all re-cover a
          section on scroll-up, which reads as vanishing content on a data grid — so
          this section stands statically and keeps its dealt moment off */}
      <section
        className="section ground-surface"
        id="checks"
        aria-labelledby="checks-h"
      >
        <div className="wrap">
          <div className="section-head">
            <h2 id="checks-h">
              Every check, four steps.{" "}
              <span className="muted">Probes, thresholds, incidents, and pruning.</span>
            </h2>
          </div>

          <div className="grid">
            <article className="card card--row card--open span-6" data-moment-block="">
              <h3>Uptime probes on a schedule</h3>
              <p>
                Solid Queue dispatches GET or HEAD checks every 30 s to 1 h with TLS checks and up to three redirects.
              </p>
              <div
                className="panel"
                data-fx="gradient-mesh"
                data-fx-seed="5"
                data-fx-palette='{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","muted":"#6f675c","accent":"#a8794a"}'
                data-fx-params='{"speed":0,"calm":0.2,"calmX":0.45,"calmY":0.95,"tint":0.6,"relief":0.35}'
                style={{ "--calm-k": "0%" } as React.CSSProperties}
              >
                <div className="stage">
                  <div
                    className="at-rise fit"
                    style={
                      {
                        "--ax": "24px",
                        "--ay": "26px",
                        "--ay-sm": "16px",
                        "--fit-max": "460px",
                      } as React.CSSProperties
                    }
                    data-ui-loop=""
                  >
                    <div className="ui ui-panel ui-pipe" data-ui="pipeline-board">
                      <div className="ui-pipe__head">
                        <svg className="ui-icon ui-pipe__branch" viewBox="0 0 16 16" aria-hidden="true">
                          <circle cx="4.5" cy="3.5" r="1.5" />
                          <circle cx="4.5" cy="12.5" r="1.5" />
                          <circle cx="11.5" cy="5" r="1.5" />
                          <path d="M4.5 5v6M11.5 6.5c0 2.6-2.2 3.6-5.6 4.6" />
                        </svg>
                        <span className="ui-pipe__repo">beacondock/worker</span>
                        <i className="ui-pipe__slash">/</i>
                        <code className="ui-pipe__ref">main</code>
                        <span className="ui-pipe__run">#4092</span>
                        <span className="ui-spacer"></span>
                        <span className="ui-pipe__total">
                          <svg className="ui-icon" viewBox="0 0 16 16" aria-hidden="true">
                            <circle cx="8" cy="8.5" r="5.5" />
                            <path d="M8 5.5v3l2 1.25M6.5 1.75h3" />
                          </svg>
                          <span data-pipe-total="">14s</span>
                        </span>
                        <span
                          className="ui-chip ui-chip--ink ui-chip--live ui-pipe__chip"
                          data-pipe-chip=""
                          data-done="Passed"
                        >
                          Running
                        </span>
                      </div>
                      <div className="ui-pipe__commit">
                        <span className="ui-avatar" data-tone="4">
                          SQ
                        </span>
                        <span className="ui-pipe__msg">ScheduleChecksJob sweep</span>
                        <code className="ui-pipe__sha">30s</code>
                        <button
                          className="ui-btn ui-btn--ghost ui-btn--sm ui-pipe__btn"
                          type="button"
                          tabIndex={-1}
                          data-pipe-btn=""
                          data-done="Re-run"
                        >
                          Cancel
                        </button>
                      </div>
                      <ol className="ui-pipe__steps">
                        <li className="ui-pipe__step is-done" data-step="schedule">
                          <span className="ui-pipe__ico">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                              <path d="m4.5 8.2 2.3 2.3 4.7-5" />
                            </svg>
                          </span>
                          <span className="ui-pipe__name">
                            <span className="ui-pipe__tool" aria-hidden="true">
                              <img src="/assets/icons/ruby.svg" alt="" />
                            </span>
                            <span className="ui-pipe__nm">Schedule</span>
                          </span>
                          <code className="ui-pipe__cmd">next_check_at &lt;= now</code>
                          <span className="ui-pipe__time" data-time="">
                            1s
                          </span>
                          <span className="ui-pipe__bar">
                            <i></i>
                          </span>
                        </li>
                        <li className="ui-pipe__step is-done" data-step="enqueue">
                          <span className="ui-pipe__ico">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                              <path d="m4.5 8.2 2.3 2.3 4.7-5" />
                            </svg>
                          </span>
                          <span className="ui-pipe__name">
                            <span className="ui-pipe__tool" aria-hidden="true">
                              <img src="/assets/icons/rails.svg" alt="" />
                            </span>
                            <span className="ui-pipe__nm">Enqueue</span>
                          </span>
                          <code className="ui-pipe__cmd">CheckMonitorJob</code>
                          <span className="ui-pipe__time" data-time="">
                            2s
                          </span>
                          <span className="ui-pipe__bar">
                            <i></i>
                          </span>
                        </li>
                        <li
                          className="ui-pipe__step is-run"
                          data-step="probe"
                          style={{ "--k": "0.6" } as React.CSSProperties}
                        >
                          <span className="ui-pipe__ico">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                              <path d="m4.5 8.2 2.3 2.3 4.7-5" />
                            </svg>
                          </span>
                          <span className="ui-pipe__name">
                            <span className="ui-pipe__tool" aria-hidden="true">
                              <img src="/assets/icons/ui-activity.svg" alt="" />
                            </span>
                            <span className="ui-pipe__nm">HTTP probe</span>
                          </span>
                          <code className="ui-pipe__cmd">HttpCheckService</code>
                          <span className="ui-pipe__time" data-time="5s">
                            3s
                          </span>
                          <span className="ui-pipe__bar">
                            <i></i>
                          </span>
                        </li>
                        <li className="ui-pipe__step" data-step="record">
                          <span className="ui-pipe__ico">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                              <path d="m4.5 8.2 2.3 2.3 4.7-5" />
                            </svg>
                          </span>
                          <span className="ui-pipe__name">
                            <span className="ui-pipe__tool" aria-hidden="true">
                              <img src="/assets/icons/sqlite.svg" alt="" />
                            </span>
                            <span className="ui-pipe__nm">Persist</span>
                          </span>
                          <code className="ui-pipe__cmd">MonitorStatusService</code>
                          <span className="ui-pipe__time" data-time="4s">
                            Queued
                          </span>
                          <span className="ui-pipe__bar">
                            <i></i>
                          </span>
                        </li>
                        <li className="ui-pipe__step" data-step="rollup">
                          <span className="ui-pipe__ico">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                              <path d="m4.5 8.2 2.3 2.3 4.7-5" />
                            </svg>
                          </span>
                          <span className="ui-pipe__name">
                            <span className="ui-pipe__tool" aria-hidden="true">
                              <img src="/assets/icons/github.svg" alt="" />
                            </span>
                            <span className="ui-pipe__nm">Rollup</span>
                          </span>
                          <code className="ui-pipe__cmd">uptime_24h + 30d</code>
                          <span className="ui-pipe__time" data-time="2s">
                            Queued
                          </span>
                          <span className="ui-pipe__bar">
                            <i></i>
                          </span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="card card--row card--open span-6" data-moment-block="">
              <h3>Incidents while monitoring</h3>
              <p>
                A failed or timed-out check never counts as healthy; two consecutive downs open an incident and recovery
                resolves it.
              </p>
              <div
                className="panel"
                data-fx="gradient-mesh"
                data-fx-seed="14"
                data-fx-palette='{"bg":"#c6d3df","surface":"#d6e0e9","ink":"#25303a","muted":"#5d6873","accent":"#3f6a92"}'
                data-fx-params='{"speed":0,"calm":0.15,"calmX":0.4,"calmY":0.95,"tint":0.6,"relief":0.35}'
                style={{ "--calm-k": "0%" } as React.CSSProperties}
              >
                <div className="stage stage--fade-b">
                  <div
                    className="at-rise fit"
                    style={
                      {
                        "--ax": "32px",
                        "--ay": "36px",
                        "--ay-sm": "24px",
                        "--fit-max": "400px",
                      } as React.CSSProperties
                    }
                  >
                    <div className="ui ui-notify" data-ui="notify">
                      <ul className="ui-notify__list" data-notify-list="">
                        <li className="ui-note">
                          <span className="ui-agent ui-note__av" aria-hidden="true"></span>
                          <span className="ui-note__text">
                            <span className="ui-note__title">
                              {downMon ? `${downMon.name} is down` : "Incident opened"}
                              <time>now</time>
                            </span>
                            <span className="ui-note__body">
                              2 consecutive failures on {downMon?.host ?? "127.0.0.1"}
                            </span>
                          </span>
                          <span className="ui-btn ui-btn--sm ui-note__btn">Inspect</span>
                        </li>
                        <li className="ui-note">
                          <span className="ui-avatar ui-note__av" data-tone="3">
                            OK
                          </span>
                          <span className="ui-note__text">
                            <span className="ui-note__title">
                              {upMon ? `${upMon.name} recovered` : "Incident resolved"}
                              <time>4m</time>
                            </span>
                            <span className="ui-note__body">HTTP 200 answered within warn threshold</span>
                          </span>
                        </li>
                        <li className="ui-note">
                          <span className="ui-avatar ui-note__av" data-tone="1">
                            MS
                          </span>
                          <span className="ui-note__text">
                            <span className="ui-note__title">
                              {degradedMon ? `${degradedMon.name} latency check` : "Slow reply flagged"}
                              <time>9m</time>
                            </span>
                            <span className="ui-note__body">Warn threshold monitored on every sweep</span>
                          </span>
                        </li>
                        <li className="ui-note">
                          <span className="ui-note__ico">
                            <svg className="ui-icon" viewBox="0 0 16 16">
                              <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                            </svg>
                          </span>
                          <span className="ui-note__text">
                            <span className="ui-note__title">
                              {upCount} endpoints healthy<time>12m</time>
                            </span>
                            <span className="ui-note__body">All scheduled sweeps completed on time</span>
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="card card--row card--open span-6" data-moment-block="">
              <h3>Degraded responses, still monitoring</h3>
              <p>
                Each monitor compares response latency against its warn threshold in milliseconds before marking the
                endpoint up.
              </p>
              <div
                className="panel"
                data-fx="gradient-mesh"
                data-fx-seed="21"
                data-fx-palette='{"bg":"#cdd6c6","surface":"#dce3d6","ink":"#262d24","muted":"#5f6a5a","accent":"#6c8e63"}'
                data-fx-params='{"speed":0,"calm":0.2,"calmX":0.6,"calmY":0.95,"tint":0.6,"relief":0.35}'
                style={{ "--calm-k": "0%" } as React.CSSProperties}
              >
                <div className="stage stage--fade-b">
                  <div
                    className="at-corner fit"
                    style={
                      {
                        "--ax": "32px",
                        "--ay": "32px",
                        "--ay-sm": "24px",
                        "--fit-max": "420px",
                      } as React.CSSProperties
                    }
                  >
                    <div className="ui ui-panel ui-toggles" data-ui="toggles">
                      <div className="ui-head">
                        <svg className="ui-icon ui-toggles__ico" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="M8 1.8 13 4v3.6c0 3-2.1 5.4-5 6.6-2.9-1.2-5-3.6-5-6.6V4z" />
                          <path d="m5.8 8 1.6 1.6 3-3.2" />
                        </svg>
                        <div className="ui-title">Probe safeguards</div>
                        <span className="ui-spacer"></span>
                        <div className="ui-meta" data-tg-count="">
                          4 of 5 on
                        </div>
                      </div>
                      <ul className="ui-toggles__list">
                        <li className="ui-tg">
                          <span className="ui-tg__text">
                            <span className="ui-tg__label">Verify TLS certificates</span>
                            <span className="ui-tg__sub">Rejects expired or mismatched chains</span>
                          </span>
                          <button
                            className="ui-switch is-on"
                            type="button"
                            role="switch"
                            aria-checked="true"
                            aria-label="Verify TLS certificates"
                          >
                            <i></i>
                          </button>
                        </li>
                        <li className="ui-tg">
                          <span className="ui-tg__text">
                            <span className="ui-tg__label">Follow up to 3 redirects</span>
                            <span className="ui-tg__sub">Fails loops past hop 3</span>
                          </span>
                          <button
                            className="ui-switch is-on"
                            type="button"
                            role="switch"
                            aria-checked="true"
                            aria-label="Follow up to 3 redirects"
                          >
                            <i></i>
                          </button>
                        </li>
                        <li className="ui-tg">
                          <span className="ui-tg__text">
                            <span className="ui-tg__label">Flag responses above 800 ms</span>
                            <span className="ui-tg__sub">Marks monitor degraded, not up</span>
                          </span>
                          <button
                            className="ui-switch is-on"
                            type="button"
                            role="switch"
                            aria-checked="true"
                            aria-label="Flag responses above 800 ms"
                          >
                            <i></i>
                          </button>
                        </li>
                        <li className="ui-tg">
                          <span className="ui-tg__text">
                            <span className="ui-tg__label">Hide URL query tokens</span>
                            <span className="ui-tg__sub">Console prints host name only</span>
                          </span>
                          <button
                            className="ui-switch is-on"
                            type="button"
                            role="switch"
                            aria-checked="true"
                            aria-label="Hide URL query tokens"
                          >
                            <i></i>
                          </button>
                        </li>
                        <li className="ui-tg">
                          <span className="ui-tg__text">
                            <span className="ui-tg__label">Pause monitor checks</span>
                            <span className="ui-tg__sub">Keeps history without polling</span>
                          </span>
                          <button
                            className="ui-switch"
                            type="button"
                            role="switch"
                            aria-checked="false"
                            aria-label="Pause monitor checks"
                          >
                            <i></i>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="card card--row card--open span-6" data-moment-block="">
              <h3>Check history kept 30 days</h3>
              <p>
                Every probe records HTTP status and latency in milliseconds; PruneOldChecksJob clears rows past 30
                days.
              </p>
              <div
                className="panel"
                data-fx="gradient-mesh"
                data-fx-seed="29"
                data-fx-palette='{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","muted":"#6f675c","accent":"#a8794a"}'
                data-fx-params='{"speed":0,"calm":0.2,"calmX":0.5,"calmY":0.95,"tint":0.6,"relief":0.35}'
                style={{ "--calm-k": "0%" } as React.CSSProperties}
              >
                <div className="stage stage--fade-b">
                  <div
                    className="at-rise fit to-edge"
                    style={
                      {
                        "--ax": "32px",
                        "--ay": "32px",
                        "--ay-sm": "24px",
                        "--fit-max": "420px",
                        "--cut": "24px",
                      } as React.CSSProperties
                    }
                  >
                    <div
                      className="ui ui-panel ui-stat is-fill"
                      data-ui="stat"
                      data-ui-opts='{"fill":true}'
                      data-from="96"
                      data-to="112"
                      data-suffix=" ms"
                    >
                      <div className="ui-stat__head">
                        <div className="ui-stat__top">
                          <span className="ui-stat__label">Median probe latency</span>
                          <span className="ui-stat__range">
                            Last 14 days
                            <svg className="ui-icon" viewBox="0 0 16 16" aria-hidden="true">
                              <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
                            </svg>
                          </span>
                        </div>
                        <div className="ui-stat__line">
                          <span className="ui-stat__num" data-stat-num="">
                            112 ms
                          </span>
                          <span className="ui-chip ui-chip--plain ui-stat__delta">30 d retention</span>
                          <span className="ui-stat__sub">
                            {upMon ? `${upMon.host} · ${upMon.http_method}` : "api.github.com · GET"}
                          </span>
                        </div>
                      </div>
                      <div className="ui-stat__chart">
                        <svg
                          className="ui-stat__svg"
                          viewBox="0 0 400 120"
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <path className="ui-stat__grid" d="M0 30.5H400M0 60.5H400M0 90.5H400" />
                          <path className="ui-stat__cover" fillRule="evenodd" d="" />
                          <g className="ui-stat__bars">
                            <rect rx="3" x="0.00" y="49.04" width="21.14" height="70.96" />
                            <rect rx="3" x="29.14" y="40.86" width="21.14" height="79.14" />
                            <rect rx="3" x="58.29" y="44.95" width="21.14" height="75.05" />
                            <rect rx="3" x="87.43" y="36.76" width="21.14" height="83.24" />
                            <rect rx="3" x="116.57" y="42.22" width="21.14" height="77.78" />
                            <rect rx="3" x="145.71" y="34.04" width="21.14" height="85.96" />
                            <rect rx="3" x="174.86" y="38.13" width="21.14" height="81.87" />
                            <rect rx="3" x="204.00" y="29.94" width="21.14" height="90.06" />
                            <rect rx="3" x="233.14" y="35.40" width="21.14" height="84.60" />
                            <rect rx="3" x="262.29" y="25.85" width="21.14" height="94.15" />
                            <rect rx="3" x="291.43" y="31.31" width="21.14" height="88.69" />
                            <rect rx="3" x="320.57" y="23.12" width="21.14" height="96.88" />
                            <rect rx="3" x="349.71" y="27.21" width="21.14" height="92.79" />
                            <rect rx="3" x="378.86" y="16.30" width="21.14" height="103.70" />
                          </g>
                        </svg>
                        <div className="ui-stat__axis" aria-hidden="true">
                          <span>14 d ago</span>
                          <span>7 d ago</span>
                          <span>Today</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* tabs-tour */}
      <section className="section" id="workflow" aria-labelledby="workflow-h">
        <div className="wrap grid grid--top">
          <div className="span-5">
            <div className="section-head">
              <h2 id="workflow-h">Monitors in terminal, API, and console</h2>
              <p className="muted">Three interfaces reading the same SQLite monitor and check ledger.</p>
            </div>
            <div className="tabs" role="tablist" aria-label="BeaconDock interfaces">
              <button
                className="tab"
                role="tab"
                type="button"
                aria-selected="true"
                aria-controls="wf-p1 wf-s1"
                id="wf-t1"
              >
                Terminal
              </button>
              <button
                className="tab"
                role="tab"
                type="button"
                aria-selected="false"
                aria-controls="wf-p2 wf-s2"
                id="wf-t2"
                tabIndex={-1}
              >
                JSON API
              </button>
              <button
                className="tab"
                role="tab"
                type="button"
                aria-selected="false"
                aria-controls="wf-p3 wf-s3"
                id="wf-t3"
                tabIndex={-1}
              >
                Console
              </button>
            </div>

            <div id="wf-p1" role="tabpanel" aria-labelledby="wf-t1">
              <p>
                Run <code>ruby bin/beacondock</code> for a diff-only boxed terminal dashboard sorted by severity with
                30-day worst-status strips.
              </p>
              <p>
                <a className="link" href="#fleet">
                  Inspect live fleet
                </a>
              </p>
            </div>

            <div id="wf-p2" role="tabpanel" aria-labelledby="wf-t2" hidden>
              <p>
                Read <code>/api/v1/status</code>, monitors, and paginated checks using a Bearer token stored only as a
                SHA-256 digest in SQLite.
              </p>
              <p>
                <a className="link" href="/monitors/new">
                  Add a monitor
                </a>
              </p>
            </div>

            <div id="wf-p3" role="tabpanel" aria-labelledby="wf-t3" hidden>
              <p>
                Store refresh intervals and browser alert banners in MongoDB; if Mongo is unreachable, the console
                keeps reading the Rails API.
              </p>
              <p>
                <a className="link" href="/settings">
                  Open console settings
                </a>
              </p>
            </div>
          </div>

          <div
            className="frame frame--split span-6 start-7"
            data-fx="gradient-mesh"
            data-fx-seed="9"
            data-fx-palette='{"bg":"#c6d3df","surface":"#d6e0e9","ink":"#25303a","muted":"#5d6873","accent":"#3f6a92"}'
            data-fx-params='{"speed":0,"calm":0.2,"calmX":0.5,"calmY":0.5,"tint":0.45,"relief":0.2}'
          >
            <div className="stage">
              <div
                id="wf-s1"
                className="at-rise fit"
                style={
                  {
                    "--fit-max": "460px",
                    "--ax": "max(24px, 50% - 230px)",
                    "--ay": "40px",
                    "--ay-sm": "24px",
                  } as React.CSSProperties
                }
              >
                <div className="ui ui-panel ui-term" data-ui="terminal-run">
                  <div className="ui-term__head">
                    <span className="ui-dots" aria-hidden="true">
                      <i></i>
                      <i></i>
                      <i></i>
                    </span>
                    <span className="ui-term__title">beacondock</span>
                    <span className="ui-meta">zsh</span>
                    <span className="ui-spacer"></span>
                    <span className="ui-chip ui-chip--plain ui-term__branch">main</span>
                  </div>
                  <div className="ui-term__screen" data-term-screen="">
                    <div className="ui-term__track" data-term-track="">
                      <div className="ui-term__ln ui-term__cmd">
                        <span className="ui-term__cwd">~/beacondock</span>
                        <span className="ui-term__sig">$</span>
                        <span className="ui-term__typed" data-term-cmd="">
                          ruby bin/beacondock --once
                        </span>
                      </div>
                      <div className="ui-term__ln ui-term__meter" data-term-out="" data-term-meter="">
                        <span className="ui-term__bar" style={{ "--p": 1 } as React.CSSProperties}>
                          <i></i>
                        </span>
                        <span className="ui-term__count" data-term-count="">
                          6 of 6 monitors
                        </span>
                      </div>
                      <div className="ui-term__ln ui-term__log" data-term-out="" data-term-step="">
                        <svg className="ui-term__tick" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                        </svg>
                        <span className="ui-term__path">staging: billing</span>
                        <span className="ui-term__n">down</span>
                        <span className="ui-term__t">87.25%</span>
                      </div>
                      <div className="ui-term__ln ui-term__log" data-term-out="" data-term-step="">
                        <svg className="ui-term__tick" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                        </svg>
                        <span className="ui-term__path">api.github.com</span>
                        <span className="ui-term__n">up</span>
                        <span className="ui-term__t">163ms</span>
                      </div>
                      <div className="ui-term__ln ui-term__log" data-term-out="" data-term-step="">
                        <svg className="ui-term__tick" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                        </svg>
                        <span className="ui-term__path">duckduckgo</span>
                        <span className="ui-term__n">up</span>
                        <span className="ui-term__t">142ms</span>
                      </div>
                      <div className="ui-term__ln ui-term__log" data-term-out="" data-term-step="">
                        <svg className="ui-term__tick" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                        </svg>
                        <span className="ui-term__path">github.com</span>
                        <span className="ui-term__n">up</span>
                        <span className="ui-term__t">112ms</span>
                      </div>
                      <div className="ui-term__ln ui-term__log" data-term-out="" data-term-step="">
                        <svg className="ui-term__tick" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                        </svg>
                        <span className="ui-term__path">internal: app /up</span>
                        <span className="ui-term__n">up</span>
                        <span className="ui-term__t">80ms</span>
                      </div>
                      <div className="ui-term__ln ui-term__log" data-term-out="" data-term-step="">
                        <svg className="ui-term__tick" viewBox="0 0 16 16" aria-hidden="true">
                          <path d="m3.5 8.4 2.8 2.8 6.2-6.4" />
                        </svg>
                        <span className="ui-term__path">status.stripe.com</span>
                        <span className="ui-term__n">up</span>
                        <span className="ui-term__t">94ms</span>
                      </div>
                      <div className="ui-term__ln ui-term__gap" data-term-out="" aria-hidden="true"></div>
                      <div className="ui-term__ln ui-term__done" data-term-out="" data-term-done="">
                        <span className="ui-term__ok">
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="m4.5 8.3 2.4 2.4 4.6-5" />
                          </svg>
                        </span>
                        <b>Rendered</b>
                        <span className="ui-term__dim">in 18ms</span>
                      </div>
                      <div className="ui-term__ln ui-term__cmd" data-term-next="">
                        <span className="ui-term__cwd">~/beacondock</span>
                        <span className="ui-term__sig">$</span>
                        <span className="ui-term__typed"></span>
                        <i className="ui-term__caret" aria-hidden="true"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                id="wf-s2"
                hidden
                className="at-rise fit"
                style={
                  {
                    "--fit-max": "440px",
                    "--ax": "max(24px, 50% - 220px)",
                    "--ay": "52px",
                    "--ay-sm": "24px",
                  } as React.CSSProperties
                }
              >
                <div className="ui ui-panel ui-code" data-ui="code">
                  <div className="ui-code__tabs">
                    <span className="ui-code__tab is-on">
                      <i className="ui-code__lang">TS</i>status.ts
                    </span>
                    <span className="ui-code__tab">
                      <i className="ui-code__lang">TS</i>checks.ts
                    </span>
                    <span className="ui-spacer"></span>
                    <span className="ui-chip ui-chip--plain ui-code__chip" data-code-chip="">
                      Bearer
                    </span>
                  </div>
                  <pre className="ui-code__pre">
                    <code>
                      <span className="ui-code__ln" data-n="1">
                        <span className="k">const</span> res = <span className="k">await</span>{" "}
                        <span className="f">fetch</span>(<span className="s">&quot;/api/v1/status&quot;</span>, {"{"}
                      </span>
                      <span className="ui-code__ln is-mark" data-n="2">
                        {"  "}headers: {"{"} Authorization: <span className="s">`Bearer ${"${key}"}`</span> {"}"},
                      </span>
                      <span className="ui-code__ln" data-n="3" data-note="Reads live SQLite status without stale cache.">
                        {"  "}cache: <span className="s">&quot;no-store&quot;</span>,
                      </span>
                      <span className="ui-code__ln" data-n="4" data-note="Bounded 4 s request timeout per API call.">
                        {"  "}signal: AbortSignal.<span className="f">timeout</span>(<span className="n">4000</span>),
                      </span>
                      <span className="ui-code__ln" data-n="5">
                        {"}"});
                      </span>
                      <span className="ui-code__ln" data-n="6">
                        <span className="k">const</span> {"{ data }"} = <span className="k">await</span> res.
                        <span className="f">json</span>();
                      </span>
                      <span className="ui-code__ln" data-n="7">
                        <span className="c">// counts: up, down, degraded, pending</span>
                      </span>
                      <span className="ui-code__ln" data-n="8">
                        <span className="k">return</span> data;
                      </span>
                    </code>
                  </pre>
                  <div className="ui-code__hint" data-code-hint="">
                    <span className="ui-dot"></span>
                    <span data-code-text="">Key stays server-side; Rails stores its SHA-256 digest.</span>
                  </div>
                </div>
              </div>

              <div
                id="wf-s3"
                hidden
                className="at-rise fit"
                style={
                  {
                    "--fit-max": "400px",
                    "--ax": "max(24px, 50% - 200px)",
                    "--ay": "52px",
                    "--ay-sm": "24px",
                  } as React.CSSProperties
                }
              >
                <div className="ui ui-panel ui-search" data-ui="search">
                  <div className="ui-search__field">
                    <svg className="ui-icon" viewBox="0 0 16 16" aria-hidden="true">
                      <circle cx="7" cy="7" r="4.5" />
                      <path d="m10.5 10.5 3 3" />
                    </svg>
                    <span className="ui-search__q">
                      <span data-search-q="">{searchList[0]?.name ?? "staging"}</span>
                      <i className="ui-search__caret"></i>
                    </span>
                    <kbd className="ui-search__kbd">/</kbd>
                  </div>
                  <div className="ui-search__group">Monitors</div>
                  <ul className="ui-search__list" data-search-list="">
                    {searchList.length > 0 ? (
                      searchList.map((m, idx) => (
                        <li key={m.id} className={`ui-search__row${idx === 0 ? " is-sel" : ""}`}>
                          <span className="ui-search__ico">
                            <svg className="ui-icon" viewBox="0 0 16 16">
                              <circle cx="8" cy="8" r="4.5" />
                            </svg>
                          </span>
                          <span className="ui-search__t">{idx === 0 ? <b>{m.name}</b> : m.name}</span>
                          <span className="ui-search__m">{STATUS_LABEL[m.last_status]}</span>
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="ui-search__row is-sel">
                          <span className="ui-search__ico">
                            <svg className="ui-icon" viewBox="0 0 16 16">
                              <circle cx="8" cy="8" r="4.5" />
                            </svg>
                          </span>
                          <span className="ui-search__t">
                            <b>staging</b>: billing
                          </span>
                          <span className="ui-search__m">Down</span>
                        </li>
                        <li className="ui-search__row">
                          <span className="ui-search__ico">
                            <svg className="ui-icon" viewBox="0 0 16 16">
                              <circle cx="8" cy="8" r="4.5" />
                            </svg>
                          </span>
                          <span className="ui-search__t">api.github.com</span>
                          <span className="ui-search__m">Up</span>
                        </li>
                        <li className="ui-search__row">
                          <span className="ui-search__ico">
                            <svg className="ui-icon" viewBox="0 0 16 16">
                              <circle cx="8" cy="8" r="4.5" />
                            </svg>
                          </span>
                          <span className="ui-search__t">internal: app /up</span>
                          <span className="ui-search__m">Up</span>
                        </li>
                      </>
                    )}
                  </ul>
                  <div className="ui-search__foot">
                    <span>
                      <kbd>&uarr;</kbd>
                      <kbd>&darr;</kbd> to move
                    </span>
                    <span>
                      <kbd>Enter</kbd> to open
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* liquid-type statement moment */}
      <section className="section statement" id="statement" data-moment="liquid-type" aria-labelledby="statement-h">
        <div className="wrap">
          <div className="split-col">
            <h2 id="statement-h" className="mo-lt__type">
              Monitoring forgives one missed check.
            </h2>
            <div className="split-col__end grid">
              <p className="t-lead span-6">
                A failed check never counts as healthy. The monitor holds its status on the first miss, opens an
                incident on the second, and resolves it on recovery.
              </p>
              <div className="btn-row span-6 start-7">
                <a className="btn btn--secondary" href="#checks">
                  Inspect check rules
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* split-text-left with horizontal BeaconDock stack fanin diagram */}
      <section className="section" id="stack" aria-labelledby="stack-h">
        <div className="wrap grid grid--top">
          <div className="span-5">
            <div className="section-head">
              <h2 id="stack-h">Monitoring API on Rails, SQLite, and Next.js</h2>
              <p>
                Solid Queue schedules every check in SQLite while this console reads <code>/api/v1</code> server-side,
                keeping Bearer tokens out of browser storage.
              </p>
            </div>
            <ul className="card__points">
              <li>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <rect x="2.5" y="3.5" width="13" height="4.5" rx="1" />
                  <rect x="2.5" y="10" width="13" height="4.5" rx="1" />
                </svg>
                <span>
                  <b>Rails 8.1 API + Ruby 4.0</b> — SiteMonitor, Check, Incident, and SHA-256 ApiKey
                </span>
              </li>
              <li>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <ellipse cx="9" cy="5" rx="6" ry="2.2" />
                  <path d="M3 5v8c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V5" />
                </svg>
                <span>
                  <b>SQLite everywhere</b> — primary tables, Solid Queue jobs, and Solid Cache
                </span>
              </li>
              <li>
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <circle cx="9" cy="9" r="6.5" />
                  <path d="M9 5.5v3.5l2.5 1.5" />
                </svg>
                <span>
                  <b>Optional MongoDB store</b> — console refresh pacing and browser alert rules
                </span>
              </li>
            </ul>
            <p style={{ marginTop: "var(--s-6)" }}>
              <a className="link" href="/settings">
                Open console settings
              </a>
            </p>
          </div>
          <div className="frame frame--split span-6 start-7">
            <div className="dg" data-diagram={JSON.stringify(PIPELINE_DIAGRAM)} data-icon-base="/assets/icons/"></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq" aria-labelledby="faq-h">
        <div className="wrap grid grid--top">
          <div className="span-5">
            <div className="section-head">
              <h2 id="faq-h">Questions on BeaconDock monitoring</h2>
              <p className="muted">
                How probes run, where the API key stays, and how the console behaves when MongoDB is offline.
              </p>
            </div>
            <p>
              <a className="link" href="/settings">
                Configure console settings
              </a>
            </p>
          </div>
          <div className="span-6 start-7">
            <div className="faq">
              <div className="faq__item">
                <h3>
                  <img src="/assets/icons/ui-shield-check.svg" alt="" width="18" height="18" />
                  Where does the API key live?
                </h3>
                <p>
                  In <code>.env.local</code> on the server. Next.js attaches the Bearer token to{" "}
                  <code>/api/v1</code> requests, and Rails stores only its SHA-256 digest.
                </p>
              </div>
              <div className="faq__item">
                <h3>
                  <img src="/assets/icons/ui-activity.svg" alt="" width="18" height="18" />
                  Does monitoring flap on one failure?
                </h3>
                <p>
                  A monitor holds its state on one failed probe, opens an incident after two consecutive failures, and
                  resolves it on the next healthy probe.
                </p>
              </div>
              <div className="faq__item">
                <h3>
                  <img src="/assets/icons/ui-database.svg" alt="" width="18" height="18" />
                  Does monitoring stop if MongoDB is offline?
                </h3>
                <p>
                  The console falls back to defaults (15 s refresh, no custom banners) and keeps managing monitors
                  through the Rails API.
                </p>
              </div>
              <div className="faq__item">
                <h3>
                  <img src="/assets/icons/ui-clock.svg" alt="" width="18" height="18" />
                  How long is check history kept?
                </h3>
                <p>
                  Thirty days. PruneOldChecksJob removes older rows daily, and <code>bin/rails checks:prune</code>{" "}
                  clears them on demand.
                </p>
              </div>
              <div className="faq__item">
                <h3>
                  <img src="/assets/icons/ui-server.svg" alt="" width="18" height="18" />
                  Does the Fleet view show secret URL tokens?
                </h3>
                <p>
                  No. Target URLs may hold secret tokens, so the fleet view and monitor header show only the parsed
                  host name; full URLs appear only in the edit form.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
