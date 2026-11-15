import { NextRequest, NextResponse } from "next/server";
import { setPrefs } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { prefs, stored } = await setPrefs({
    refreshSeconds: body.refreshSeconds,
    checksPerPage: body.checksPerPage,
  });
  if (!stored) return NextResponse.json({ error: "store offline" }, { status: 503 });
  return NextResponse.json({ prefs });
}
