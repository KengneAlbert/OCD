import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { payUrlFor } from "@/lib/db/payments";
import { insertReservation } from "@/lib/db/reservations";
import { getBrevoEnv, sendEmail } from "@/lib/emails/send";
import { reservationLikeFromForm, reservationReceivedEmail, reservationTeamEmail, toReservationView } from "@/lib/emails/templates";
import { RESERVATION_PROVIDER } from "@/lib/notifications/provider";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isSlotBookable } from "@/lib/schedule";
import { isPaymentEnabled } from "@/lib/payments/swinmo";
import { createReservationSchema } from "@/lib/validation/reservation";

export const runtime = "nodejs";

/**
 * POST /api/reservations
 * 1. Protections : rate limiting, honeypot, validation zod serveur, créneau valide.
 * 2. Enregistrement dans Supabase (si configuré) : un créneau ne peut être pris qu'une fois.
 * 3. Emails Brevo : confirmation au client + alerte à l'équipe (canal unique des réservations).
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

  // Les réservations partent uniquement par email : l'adresse est obligatoire.
  const provider = RESERVATION_PROVIDER;
  const parsed = createReservationSchema({ emailRequired: true }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 422 });
  }

  const reservation = parsed.data;
  if (!isSlotBookable(reservation.date, reservation.slotStart, new Date())) {
    return NextResponse.json({ error: "Ce créneau n'est plus disponible. Choisis-en un autre." }, { status: 409 });
  }

  // ─── Stockage ───
  const stored = await insertReservation(reservation, {
    channel: provider,
    ip,
    userAgent: request.headers.get("user-agent"),
    timezone: typeof body.timezone === "string" ? body.timezone.slice(0, 64) : undefined,
  });
  if (stored && !stored.ok) {
    if (stored.reason === "slot_taken") {
      return NextResponse.json({ error: "Oups, ce créneau vient d'être réservé. Choisis-en un autre." }, { status: 409 });
    }
    if (stored.reason === "duplicate") return NextResponse.json({ ok: true, duplicate: true });
    // Erreur technique : on n'empêche pas la réservation de partir (WhatsApp / email).
  }

  // Lien de paiement Mobile Money (si Swinmo est configuré et la réservation enregistrée).
  const payUrl = stored?.ok && stored.payToken && isPaymentEnabled() ? payUrlFor(stored.payToken) : undefined;

  // ─── Emails ───
  const brevo = getBrevoEnv();
  if (!brevo && !stored?.ok) {
    console.error("[reservations] Brevo non configuré et réservation non enregistrée.");
    return NextResponse.json({ error: "Service d'envoi indisponible. Contacte-nous sur WhatsApp." }, { status: 503 });
  }

  let emailed = false;
  if (brevo) {
    const view = toReservationView({ ...reservationLikeFromForm(reservation), payUrl });
    const entity = stored?.ok ? { type: "reservation" as const, id: stored.id } : undefined;
    const adminUrl = stored?.ok ? `${siteConfig.url}/admin/reservations/${stored.id}` : undefined;
    const [team, client] = await Promise.all([
      sendEmail(
        {
          template: "reservation-equipe",
          to: { email: brevo.teamEmail, name: "Équipe OCD Live" },
          replyTo: view.email ? { email: view.email, name: view.fullName } : undefined,
          content: reservationTeamEmail(view, adminUrl),
          entity,
        },
        brevo,
      ),
      view.email
        ? sendEmail(
            { template: "reservation-recue", to: { email: view.email, name: view.fullName }, content: reservationReceivedEmail(view), entity },
            brevo,
          )
        : Promise.resolve({ ok: true }),
    ]);
    emailed = team.ok && client.ok;
    if (!team.ok && !stored?.ok) {
      return NextResponse.json({ error: "L'envoi a échoué. Réessaie ou contacte-nous sur WhatsApp." }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true, stored: Boolean(stored?.ok), emailed, payUrl });
}
