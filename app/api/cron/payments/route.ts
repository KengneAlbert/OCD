import { NextResponse } from "next/server";
import { runPaymentsJob } from "@/lib/jobs/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/payments — toutes les 5 minutes, appelée par Supabase (pg_cron + pg_net,
 * voir supabase/cron/payments.sql) avec « Authorization: Bearer <CRON_SECRET> ».
 * Libère les créneaux non payés, rapproche les paiements avec Swinmo, envoie les relances.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET non configuré." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    const result = await runPaymentsJob();
    if (result.reconciled || result.expired || result.errors || result.reservationReminders || result.subscriptionReminders) {
      console.info("[cron.payments]", result);
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron.payments]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, error: "Erreur" }, { status: 500 });
  }
}
