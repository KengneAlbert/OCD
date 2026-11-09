import { NextResponse } from "next/server";
import { payUrlFor } from "@/lib/db/payments";
import { insertReservation } from "@/lib/db/reservations";
import { HOLD_MINUTES } from "@/lib/db/holds";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isSlotBookable } from "@/lib/schedule";
import { isPaymentEnabled } from "@/lib/payments/swinmo";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createReservationSchema } from "@/lib/validation/reservation";

export const runtime = "nodejs";

/**
 * POST /api/reservations
 * 1. Protections : rate limiting, honeypot, validation zod serveur, créneau valide.
 * 2. Le créneau est bloqué dans Supabase (un créneau ne peut être pris qu'une fois)
 *    pendant HOLD_MINUTES, le temps de payer.
 * 3. Réponse : lien de paiement. Pas de réservation sans paiement : les emails partent
 *    et la réservation passe « Payée » seulement après le paiement (lib/db/payments.ts).
 */
export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`reservation:${ip}`, 5);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessaie dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  // Honeypot : un humain ne remplit jamais ce champ caché → on fait semblant d'accepter.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // L'email est obligatoire : la confirmation de paiement y est envoyée.
  const parsed = createReservationSchema({ emailRequired: true }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 422 });
  }

  const reservation = parsed.data;
  if (!isSlotBookable(reservation.date, reservation.slotStart, new Date())) {
    return NextResponse.json({ error: "Ce créneau n'est plus disponible. Choisis-en un autre." }, { status: 409 });
  }

  // Pas de réservation sans paiement : stockage + paiement en ligne obligatoires.
  if (!isSupabaseConfigured() || !isPaymentEnabled()) {
    console.error(
      "[reservations] Réservation impossible : variables manquantes →",
      [
        !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
        !process.env.SWINMO_SECRET_KEY && "SWINMO_SECRET_KEY",
      ]
        .filter(Boolean)
        .join(", "),
    );
    return NextResponse.json(
      { error: "La réservation en ligne est momentanément indisponible. Réessaie dans quelques minutes ou contacte-nous." },
      { status: 503 },
    );
  }

  // ─── Blocage du créneau (en attente du paiement) ───
  const stored = await insertReservation(reservation, {
    channel: "site",
    ip,
    userAgent: request.headers.get("user-agent"),
    timezone: typeof body.timezone === "string" ? body.timezone.slice(0, 64) : undefined,
  });
  if (!stored?.ok) {
    if (stored?.reason === "slot_taken") {
      return NextResponse.json({ error: "Oups, ce créneau vient d'être réservé. Choisis-en un autre." }, { status: 409 });
    }
    if (stored?.reason === "duplicate" && stored.payToken) {
      return NextResponse.json({ ok: true, duplicate: true, payUrl: payUrlFor(stored.payToken) });
    }
    return NextResponse.json({ error: "La réservation n'a pas pu être enregistrée. Réessaie." }, { status: 500 });
  }
  if (!stored.payToken) {
    return NextResponse.json({ error: "La réservation n'a pas pu être enregistrée. Réessaie." }, { status: 500 });
  }

  // Les emails (client + équipe) partent uniquement une fois le paiement reçu (voir applyCharge).
  return NextResponse.json({ ok: true, stored: true, payUrl: payUrlFor(stored.payToken), holdMinutes: HOLD_MINUTES });
}
