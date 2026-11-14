import { NextResponse } from "next/server";
import { logActivity } from "@/lib/db/activity";
import { defer } from "@/lib/payments/defer";
import { CHARGE_ID_RE } from "@/lib/payments/rules";
import { getSwinmoEnv, verifyWebhookSignature } from "@/lib/payments/swinmo";
import { isKnownReference, verifyTransactionWithProvider } from "@/lib/payments/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WebhookEvent {
  id?: string;
  event?: string;
  environment?: string;
  data?: { object?: string; id?: unknown; reference?: unknown };
}

/**
 * POST /api/payments/webhook — URL déclarée dans le tableau de bord Swinmo Pay
 * (Développeurs → Webhooks), une par environnement, avec son secret.
 *
 * Le webhook n'est qu'un SIGNAL :
 * 1. signature HMAC vérifiée sur le corps brut (temps constant, 5 min max) — sinon 400 ;
 * 2. la référence doit avoir été créée par notre système — sinon 404 + journal ;
 * 3. réponse 200 immédiate, puis la charge est RELUE chez Swinmo (GET /v1/charges/:id)
 *    et seules ces données sont appliquées (jamais le corps du webhook, même signé).
 * Swinmo n'envoie chaque événement qu'une fois : la tâche de rapprochement rattrape les pertes.
 */
export async function POST(request: Request) {
  const env = getSwinmoEnv();
  if (!env?.webhookSecret) {
    console.error("[payments.webhook] SWINMO_WEBHOOK_SECRET manquant.");
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 503 });
  }

  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-swinmo-signature"), env.webhookSecret)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  // « ping » du tableau de bord, autre environnement, événement inconnu : accusé de réception, rien d'autre.
  if (event.data?.object !== "charge" || (event.event !== "charge.succeeded" && event.event !== "charge.failed")) {
    return NextResponse.json({ received: true });
  }
  if (event.environment !== env.environment) return NextResponse.json({ received: true, ignored: "environment" });

  const chargeId = event.data.id;
  if (typeof chargeId !== "string" || !CHARGE_ID_RE.test(chargeId)) {
    return NextResponse.json({ error: "Charge invalide." }, { status: 400 });
  }

  // ID interne : la tentative doit exister dans NOTRE base.
  const reference = event.data.reference;
  if (!(await isKnownReference(reference))) {
    await logActivity({
      entityType: "system",
      action: "payment_anomaly",
      message: `⚠️ Webhook rejeté : référence inconnue (${String(reference).slice(0, 80)}, charge ${chargeId}).`,
    });
    return NextResponse.json({ error: "Transaction inconnue." }, { status: 404 });
  }

  // Réponse rapide ; la vérification chez Swinmo et les emails se font juste après.
  await defer(() => verifyTransactionWithProvider(chargeId, "webhook", { expectReference: reference as string }));
  return NextResponse.json({ received: true });
}
