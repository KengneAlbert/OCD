import { NextResponse } from "next/server";
import { applyCharge } from "@/lib/db/payments";
import { getSwinmoEnv, verifyWebhookSignature, type SwinmoCharge } from "@/lib/payments/swinmo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WebhookEvent {
  id: string;
  event: "charge.succeeded" | "charge.failed" | "ping" | string;
  environment: "test" | "live";
  created_at: number;
  data: SwinmoCharge | { object: "ping" };
}

/**
 * POST /api/payments/webhook — URL à déclarer dans le tableau de bord Swinmo Pay
 * (Développeurs → Webhooks), une par environnement, avec son secret.
 * Signature vérifiée sur le corps BRUT ; réponse 2xx rapide (< 10 s).
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

  // Un événement d'un autre environnement (ex. test reçu sur la prod) est ignoré.
  if (event.environment !== env.environment || event.data.object !== "charge") {
    return NextResponse.json({ received: true });
  }

  if (event.event === "charge.succeeded" || event.event === "charge.failed") {
    try {
      const result = await applyCharge(event.data as SwinmoCharge, "webhook");
      return NextResponse.json({ received: true, result });
    } catch (error) {
      console.error("[payments.webhook]", error);
      // 500 : visible dans le tableau de bord Swinmo. Le rattrapage reste possible depuis l'admin.
      return NextResponse.json({ error: "Traitement impossible." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
