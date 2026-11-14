import { NextResponse } from "next/server";
import { getReservationByToken } from "@/lib/db/payments";
import { CHARGE_ID_RE } from "@/lib/payments/rules";
import { verifyTransactionWithProvider } from "@/lib/payments/verify";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/payments/confirm { token, chargeId } — appelé par le navigateur après `onSuccess`.
 * Le navigateur ne fait rien foi : la charge est RELUE chez Swinmo et doit appartenir à cette
 * réservation ; elle est ensuite appliquée par le service unique (idempotent).
 */
export async function POST(request: Request) {
  const limit = rateLimit(`payment-confirm:${getClientIp(request.headers)}`, 20);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { token?: unknown; chargeId?: unknown };
  if (typeof body.token !== "string" || typeof body.chargeId !== "string" || !CHARGE_ID_RE.test(body.chargeId)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const reservation = await getReservationByToken(body.token);
  if (!reservation) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });

  try {
    // La charge doit appartenir à cette réservation (référence « OCD-XXXXXX-… »).
    const outcome = await verifyTransactionWithProvider(body.chargeId, "retour client", {
      authorize: (charge) => charge.reference.startsWith(`${reservation.reference}-`),
    });
    if (!outcome.ok) return NextResponse.json({ error: "Paiement non reconnu." }, { status: 400 });
    return NextResponse.json({ status: outcome.charge.status, result: outcome.result });
  } catch (error) {
    console.error("[payments.confirm]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Vérification impossible pour le moment." }, { status: 502 });
  }
}
