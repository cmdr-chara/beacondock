export default function NotFound() {
  return (
    <section className="section section--hero bg-topglow">
      <div className="wrap">
        <p className="hero-notice">404</p>
        <h1>No monitor by that name</h1>
        <p className="t-lead" style={{ marginTop: "var(--s-4)" }}>
          The fleet lives on the dashboard — the API keeps the records.
        </p>
        <div className="btn-row" style={{ marginTop: "var(--s-6)" }}>
          <a className="btn btn--primary" href="/">
            Back to the fleet
            <svg className="m-arrow" viewBox="0 0 12 12" aria-hidden="true">
              <path className="m-arrow__stem" d="M1 6h8" />
              <path className="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
