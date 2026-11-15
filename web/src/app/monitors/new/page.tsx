import MonitorForm from "@/components/MonitorForm";

export const metadata = { title: "Add a monitor: BeaconDock" };

export default async function NewMonitor({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  return (
    <section className="section section--hero" aria-labelledby="new-h">
      <div className="wrap">
        <div className="grid">
          <div className="span-4">
            <span className="t-label muted">New monitor</span>
            <h1 id="new-h">Add a monitor</h1>
            <p className="t-lead">
              The worker checks it on the schedule you set and opens an incident after two consecutive failures.
            </p>
          </div>
          <div className="span-7 start-6 ui-panel" style={{ padding: "var(--s-5)" }}>
            <MonitorForm error={err} />
          </div>
        </div>
      </div>
    </section>
  );
}
