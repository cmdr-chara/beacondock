import { NextResponse } from "next/server";
import { deleteAlertRule } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await deleteAlertRule(id);
  if (!res.stored) return NextResponse.json({ error: "not deleted" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
