import { NextResponse } from "next/server";
import { getBrevoEnv, sendCandidatureEmail } from "@/lib/notifications/brevo";
import { resolveProvider, usesEmail } from "@/lib/notifications/provider";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { candidatureSchema } from "@/lib/validation/candidature";

export const runtime = "nodejs";

/** POST /api/candidatures — phase 2 (Brevo). Même protections que les réservations. */
export async function POST(request: Request) {
  const limit = rateLimit(`candidature:${getClientIp(request.headers)}`, 3);
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

  const provider = resolveProvider(process.env.NOTIFICATION_PROVIDER);
  if (!usesEmail(provider)) return NextResponse.json({ ok: true, emailed: false });

  const env = getBrevoEnv();
  if (!env) {
    console.error("[candidatures] Variables Brevo manquantes.");
    return NextResponse.json({ error: "Service d'envoi indisponible. Contacte-nous sur WhatsApp." }, { status: 503 });
  }

  try {
    await sendCandidatureEmail(parsed.data, env);
    return NextResponse.json({ ok: true, emailed: true });
  } catch (error) {
    console.error("[candidatures] Échec Brevo", error);
    return NextResponse.json({ error: "L'envoi a échoué. Réessaie ou contacte-nous sur WhatsApp." }, { status: 502 });
  }
}
