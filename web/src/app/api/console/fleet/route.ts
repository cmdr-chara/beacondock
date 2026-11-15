import { NextResponse } from "next/server";
import { getStatus, listChecks, listMonitors } from "@/lib/api";

// The polled fleet snapshot: status + monitors + each monitor's latest latency.
export const dynamic = "force-dynamic";

export async function GET() {
  const [statusRes, monitorsRes] = await Promise.all([getStatus(), listMonitors()]);
  const monitors = monitorsRes.ok ? monitorsRes.data : [];
  const entries = await Promise.all(
    monitors.map(async (m) => {
      const r = await listChecks(String(m.id), 1, 1);
      return [m.id, r.ok ? (r.data.data[0]?.latency_ms ?? null) : null] as const;
    })
  );
  return NextResponse.json({
    status: statusRes.ok ? statusRes.data : null,
    monitors,
    latency: Object.fromEntries(entries),
    offline: !statusRes.ok && !monitorsRes.ok,
  });
}
