import { NextResponse } from "next/server";
import { getPayState, getReservationByToken, startPayment } from "@/lib/db/payments";
import { isPaymentEnabled, SwinmoError } from "@/lib/payments/swinmo";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/payments/session { token }
 * Crée une session de checkout Swinmo pour la réservation liée au jeton.
 * Le montant est lu en base : le navigateur ne reçoit que l'identifiant de session.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`payment:${getClientIp(request.headers)}`, 10);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessaie dans quelques minutes." }, { status: 429 });
  }
  if (!isPaymentEnabled()) {
    return NextResponse.json({ error: "Le paiement en ligne n'est pas encore disponible." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { token?: unknown };
  const reservation = typeof body.token === "string" ? await getReservationByToken(body.token) : null;
  if (!reservation) return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });

  const state = await getPayState(reservation);
  if (state === "paid") return NextResponse.json({ error: "Cette réservation est déjà payée. Merci !" }, { status: 409 });
  if (state === "expired") {
    return NextResponse.json({ error: "Le délai de paiement est dépassé et le créneau a été libéré. Refais une réservation." }, { status: 409 });
  }
  if (state === "closed") return NextResponse.json({ error: "Cette réservation ne peut plus être payée. Contacte l'équipe." }, { status: 409 });

  try {
    const { sessionId } = await startPayment(reservation);
    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error("[payments.session]", error);
    const message =
      error instanceof SwinmoError && error.code === "account_disabled"
        ? "Le paiement en ligne est momentanément indisponible."
        : "Impossible d'ouvrir le paiement. Réessaie dans un instant.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
