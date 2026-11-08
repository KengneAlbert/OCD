import { NextResponse } from "next/server";
import { getBrevoEnv, sendReservationEmails } from "@/lib/notifications/brevo";
import { resolveProvider, usesEmail } from "@/lib/notifications/provider";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isSlotBookable } from "@/lib/schedule";
import { createReservationSchema } from "@/lib/validation/reservation";

export const runtime = "nodejs";

/**
 * POST /api/reservations — phase 2 (Brevo).
 * Validation zod serveur + honeypot + rate limiting. Inactif tant que
 * NOTIFICATION_PROVIDER=whatsapp (renvoie 200 sans envoyer d'email).
 */
export async function POST(request: Request) {
  const limit = rateLimit(`reservation:${getClientIp(request.headers)}`, 5);
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

  const provider = resolveProvider(process.env.NOTIFICATION_PROVIDER);
  const parsed = createReservationSchema({ emailRequired: usesEmail(provider) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides.", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const reservation = parsed.data;
  if (!isSlotBookable(reservation.date, reservation.slotStart, new Date())) {
    return NextResponse.json({ error: "Ce créneau n'est plus disponible. Choisis-en un autre." }, { status: 409 });
  }

  if (!usesEmail(provider)) {
    return NextResponse.json({ ok: true, emailed: false });
  }

  const env = getBrevoEnv();
  if (!env) {
    console.error("[reservations] Variables Brevo manquantes (BREVO_API_KEY, BREVO_SENDER_EMAIL, OCD_TEAM_EMAIL).");
    return NextResponse.json({ error: "Service d'envoi indisponible. Contacte-nous sur WhatsApp." }, { status: 503 });
  }

  try {
    await sendReservationEmails(reservation, env);
    return NextResponse.json({ ok: true, emailed: true });
  } catch (error) {
    console.error("[reservations] Échec Brevo", error);
    return NextResponse.json({ error: "L'envoi a échoué. Réessaie ou contacte-nous sur WhatsApp." }, { status: 502 });
  }
}
