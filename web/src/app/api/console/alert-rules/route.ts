import { NextRequest, NextResponse } from "next/server";
import { addAlertRule, listAlertRules, type AlertEvent } from "@/lib/store";

export const dynamic = "force-dynamic";

const EVENTS: AlertEvent[] = ["down", "degraded", "up"];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const event = EVENTS.includes(body.event) ? (body.event as AlertEvent) : null;
  const monitorId = body.monitorId === null ? null : Number(body.monitorId);
  if (!event || (monitorId !== null && !Number.isInteger(monitorId))) {
    return NextResponse.json({ error: "bad rule" }, { status: 400 });
  }
  const res = await addAlertRule({ monitorId, event });
  if (!res.stored) return NextResponse.json({ error: "store offline" }, { status: 503 });
  const { rules } = await listAlertRules();
  return NextResponse.json({ rules });
}
