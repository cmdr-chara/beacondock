import { NextRequest, NextResponse } from "next/server";
import { listChecks } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = Number(req.nextUrl.searchParams.get("page") ?? "1") || 1;
  const perPage = Math.min(Math.max(Number(req.nextUrl.searchParams.get("per_page") ?? "20") || 20, 1), 100);
  const res = await listChecks(id, page, perPage);
  if (!res.ok) return NextResponse.json({ error: res.error.message }, { status: res.status || 502 });
  return NextResponse.json(res.data);
}
