import { NextRequest, NextResponse } from "next/server";
import { deleteMonitor, updateMonitor } from "@/lib/api";

export const dynamic = "force-dynamic";

function monitorParams(fd: FormData) {
  const num = (k: string) => {
    const raw = fd.get(k);
    if (raw === null || String(raw).trim() === "") return undefined;
    const v = Number(raw);
    return Number.isFinite(v) ? v : undefined;
  };
  return {
    name: String(fd.get("name") ?? "").trim(),
    url: String(fd.get("url") ?? "").trim(),
    http_method: String(fd.get("http_method") ?? "GET"),
    interval_seconds: num("interval_seconds"),
    timeout_seconds: num("timeout_seconds"),
    expected_status: num("expected_status"),
    warn_latency_ms: num("warn_latency_ms"),
    active: fd.get("active") === "true",
  };
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const fd = await req.formData();
  const res = await updateMonitor(id, monitorParams(fd));
  if (!res.ok) {
    const back = new URL(`/monitors/${id}/edit`, req.url);
    back.searchParams.set("err", res.error.message.slice(0, 160));
    return NextResponse.redirect(back, 303);
  }
  return NextResponse.redirect(new URL(`/monitors/${id}`, req.url), 303);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const res = await deleteMonitor(id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error.message }, { status: res.status || 502 });
  }
  return NextResponse.json({ ok: true });
}
