import { notFound } from "next/navigation";
import MonitorForm from "@/components/MonitorForm";
import { getMonitor } from "@/lib/api";

export const metadata = { title: "Edit a monitor — BeaconDock" };

export default async function EditMonitor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { id } = await params;
  const { err } = await searchParams;
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) notFound();
  const monitorRes = await getMonitor(id);
  if (!monitorRes.ok) notFound();
  const monitor = monitorRes.data;

  return (
    <section className="section section--hero bg-topglow" aria-labelledby="edit-h">
      <div className="wrap">
        <div className="grid">
          <div className="span-4">
            <span className="t-label">{monitor.name}</span>
            <h1 id="edit-h">Change the watch</h1>
            <p className="t-lead">
              {monitor.host} · currently {monitor.active ? "checking" : "paused"} every {monitor.interval_seconds}{" "}
              seconds.
            </p>
          </div>
          <div className="span-7 start-6 ui-panel" style={{ padding: "var(--s-5)" }}>
            <MonitorForm monitor={monitor} error={err} />
          </div>
        </div>
      </div>
    </section>
  );
}
