import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { insertCandidature } from "@/lib/db/reservations";
import { getBrevoEnv, sendEmail } from "@/lib/emails/send";
import { candidatureLikeFromForm, candidatureReceivedEmail, candidatureTeamEmail, toCandidatureView } from "@/lib/emails/templates";
import { CANDIDATURE_PROVIDER, usesEmail } from "@/lib/notifications/provider";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { candidatureSchema } from "@/lib/validation/candidature";

export const runtime = "nodejs";

/** POST /api/candidatures : mêmes protections que les réservations, stockage + emails. */
export async function POST(request: Request) {
  if (!(await getSettings()).recrutementOuvert) {
    return NextResponse.json({ error: "Le recrutement est fermé pour le moment." }, { status: 403 });
  }
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`candidature:${ip}`, 3);
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

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const parsed = candidatureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 422 });
  }

  const stored = await insertCandidature(parsed.data, { ip });
  if (stored && !stored.ok && stored.reason === "duplicate") return NextResponse.json({ ok: true, duplicate: true });

  // Candidature : toujours enregistrée pour l'admin + email à l'équipe (plus de WhatsApp).
  const provider = CANDIDATURE_PROVIDER;
  const brevo = usesEmail(provider) ? getBrevoEnv() : null;
  if (provider === "brevo" && !brevo && !stored?.ok) {
    return NextResponse.json({ error: "Service d'envoi indisponible. Contacte-nous sur WhatsApp." }, { status: 503 });
  }

  let emailed = false;
  if (brevo) {
    const view = toCandidatureView(candidatureLikeFromForm(parsed.data));
    const entity = stored?.ok ? { type: "candidature" as const, id: stored.id } : undefined;
    const adminUrl = stored?.ok ? `${siteConfig.url}/admin/candidatures/${stored.id}` : undefined;
    const [team, ack] = await Promise.all([
      sendEmail(
        { template: "candidature-equipe", to: { email: brevo.teamEmail, name: "Équipe OCD Live" }, content: candidatureTeamEmail(view, adminUrl), entity },
        brevo,
      ),
      view.email
        ? sendEmail(
            { template: "candidature-recue", to: { email: view.email, name: view.fullName }, content: candidatureReceivedEmail(view), entity },
            brevo,
          )
        : Promise.resolve({ ok: true }),
    ]);
    emailed = team.ok && ack.ok;
    if (provider === "brevo" && !team.ok && !stored?.ok) {
      return NextResponse.json({ error: "L'envoi a échoué. Réessaie ou contacte-nous sur WhatsApp." }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true, stored: Boolean(stored?.ok), emailed });
}
