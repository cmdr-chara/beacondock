import type { Monitor } from "@/lib/types";

// Shared monitor form, kit .form/.field markup. Posts natively to the console
// route (no client JS): valid fields submit, the route answers with a 303.
export default function MonitorForm({ monitor, error }: { monitor?: Monitor; error?: string }) {
  const action = monitor ? `/api/console/monitors/${monitor.id}` : "/api/console/monitors";
  return (
    <form className="form" method="post" action={action}>
      <div className="field">
        <label htmlFor="f-name">Name</label>
        <input id="f-name" name="name" type="text" required maxLength={120} defaultValue={monitor?.name}
          aria-describedby="f-name-err" placeholder="billing API" />
        <p className="field__error" id="f-name-err" hidden>Give the monitor a name.</p>
      </div>
      <div className="field">
        <label htmlFor="f-method">Method</label>
        <select id="f-method" name="http_method" defaultValue={monitor?.http_method ?? "GET"}>
          {["GET", "HEAD"].map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>
      <div className="field field--full">
        <label htmlFor="f-url">URL</label>
        <input id="f-url" name="url" type="url" required defaultValue={monitor?.url}
          aria-describedby="f-url-err f-url-note" placeholder="https://billing.internal.example/health" />
        <p className="field__error" id="f-url-err" hidden>Give the full URL to check, including https://.</p>
        <p className="t-small muted" id="f-url-note">The URL may carry credentials or tokens — the console shows only its host.</p>
      </div>
      <div className="field">
        <label htmlFor="f-interval">Check every</label>
        <select id="f-interval" name="interval_seconds" defaultValue={monitor?.interval_seconds ?? 60}>
          {[30, 60, 120, 300, 600, 1800, 3600].map((v) => (
            <option key={v} value={v}>{v >= 60 ? `${v / 60} min` : `${v} s`}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="f-timeout">Timeout (s)</label>
        <input id="f-timeout" name="timeout_seconds" type="number" min={1} max={120} required
          defaultValue={monitor?.timeout_seconds ?? 10} aria-describedby="f-timeout-err" />
        <p className="field__error" id="f-timeout-err" hidden>Between 1 and 120 seconds.</p>
      </div>
      <div className="field">
        <label htmlFor="f-expected">Expected status</label>
        <input id="f-expected" name="expected_status" type="number" min={100} max={599} required
          defaultValue={monitor?.expected_status ?? 200} aria-describedby="f-expected-err" />
        <p className="field__error" id="f-expected-err" hidden>An HTTP status code, 100–599.</p>
      </div>
      <div className="field">
        <label htmlFor="f-warn">Degrade above (ms)</label>
        <input id="f-warn" name="warn_latency_ms" type="number" min={0} max={60000}
          defaultValue={monitor?.warn_latency_ms ?? ""} placeholder="off" aria-describedby="f-warn-note" />
        <p className="t-small muted" id="f-warn-note">A successful check slower than this counts as degraded, not up.</p>
      </div>
      <div className="field">
        <label htmlFor="f-active">State</label>
        <select id="f-active" name="active" defaultValue={monitor ? String(monitor.active) : "true"}>
          <option value="true">Checking</option>
          <option value="false">Paused</option>
        </select>
      </div>
      {error ? (
        <p className="t-small st-down" role="alert" style={{ color: "var(--st)" }}>
          {error}
        </p>
      ) : null}
      <p className="form__status t-small" data-form-status role="status" />
      <div className="btn-row">
        <button className="btn btn--primary" type="submit">
          {monitor ? "Save the monitor" : "Add the monitor"}
          <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
            <path className="m-arrow__stem" d="M1 6h8" />
            <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
          </svg>
        </button>
        <a className="btn btn--secondary" href={monitor ? `/monitors/${monitor.id}` : "/"}>Cancel</a>
      </div>
    </form>
  );
}
