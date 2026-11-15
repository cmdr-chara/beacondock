import { NextRequest, NextResponse } from "next/server";
import { createMonitor } from "@/lib/api";

// The monitor form posts natively (no client JS): FormData in, 303 redirect out.
export const dynamic = "force-dynamic";

function monitorParams(fd: FormData) {
  const num = (k: string) => {
    const v = Number(fd.get(k));
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

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const res = await createMonitor(monitorParams(fd));
  const back = new URL("/monitors/new", req.url);
  if (!res.ok) {
    back.searchParams.set("err", res.error.message.slice(0, 160));
    return NextResponse.redirect(back, 303);
  }
  return NextResponse.redirect(new URL("/", req.url), 303);
}
