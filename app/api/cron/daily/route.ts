import { NextResponse } from "next/server";
import { runDailyJob } from "@/lib/jobs/daily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/daily — appelée par Vercel Cron chaque matin (voir vercel.json).
 * Vercel envoie « Authorization: Bearer <CRON_SECRET> » : sans ce secret, la route refuse.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    const result = await runDailyJob();
    console.info("[cron.daily]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron.daily]", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Erreur" }, { status: 500 });
  }
}
