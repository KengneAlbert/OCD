import { NextResponse } from "next/server";
import { getLivesNow } from "@/lib/db/lives";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/lives → lives en cours (réservations OCD en tête, puis abonnés par pays). */
export async function GET() {
  const data = await getLivesNow();
  return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" } });
}
