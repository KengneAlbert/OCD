import { NextResponse } from "next/server";
import { applyCharge, getReservationByToken } from "@/lib/db/payments";
import { getCharge } from "@/lib/payments/swinmo";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/payments/confirm { token, chargeId }
 * Appelé par le navigateur après `onSuccess`. On ne fait PAS confiance au navigateur :
 * la charge est relue chez Swinmo (GET /v1/charges/:id) puis appliquée de façon idempotente.
 * Sert aussi de filet de sécurité, les webhooks Swinmo n'étant pas renvoyés en cas d'échec.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`payment-confirm:${getClientIp(request.headers)}`, 20);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { token?: unknown; chargeId?: unknown };
  if (typeof body.token !== "string" || typeof body.chargeId !== "string" || !/^ch_(test|live)_[\w-]{4,80}$/.test(body.chargeId)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const reservation = await getReservationByToken(body.token);
  if (!reservation) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });

  try {
    const charge = await getCharge(body.chargeId);
    // La charge doit appartenir à cette réservation (référence « OCD-XXXXXX-… »).
    if (!charge.reference.startsWith(`${reservation.reference}-`)) {
      return NextResponse.json({ error: "Paiement non reconnu." }, { status: 400 });
    }
    const result = await applyCharge(charge, "retour client");
    return NextResponse.json({ status: charge.status, result });
  } catch (error) {
    console.error("[payments.confirm]", error);
    return NextResponse.json({ error: "Vérification impossible pour le moment." }, { status: 502 });
  }
}
