import { NextResponse } from "next/server";
import { getTakenSlots } from "@/lib/db/reservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD → créneaux déjà réservés. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? from;
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json({ error: "Paramètres from/to invalides." }, { status: 400 });
  }
  const taken = await getTakenSlots(from, to);
  return NextResponse.json({ taken }, { headers: { "Cache-Control": "no-store" } });
}
