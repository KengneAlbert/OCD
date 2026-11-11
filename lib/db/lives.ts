import "server-only";
import { randomBytes } from "node:crypto";
import { cache } from "react";
import { DEFAULT_CATEGORY, getCategory } from "@/config/live-categories";
import { getCountry } from "@/config/countries";
import { livesConfig } from "@/config/lives";
import { siteConfig } from "@/config/site";
import { getBrevoEnv, sendEmail } from "@/lib/emails/send";
import { liveReviewEmail, liveToReviewEmail, subscriptionPaidEmail } from "@/lib/emails/lives";
import { countrySlug, extendSubscription, hourLabel, isSubscriptionActive, PLATFORMS, type Platform } from "@/lib/lives";
import { createCheckoutSession, getSwinmoEnv, operatorLabel, XOF_COUNTRIES, type SwinmoCharge } from "@/lib/payments/swinmo";
import { getServiceClient } from "@/lib/supabase/admin";
import { logActivity } from "./activity";
import type { ApplyResult } from "./payments";
import type { ReservationRow } from "./types";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface SubscriberRow {
  id: string;
  email: string;
  full_name: string;
  business_name: string;
  country: string;
  city: string | null;
  category: string;
  avatar_url: string | null;
  tiktok_handle: string;
  phone_e164: string | null;
  status: "actif" | "suspendu";
  paid_until: string | null;
  admin_notes: string | null;
  created_at: string;
}

export type LiveStatus = "en_attente" | "valide" | "refuse" | "termine";

export interface LiveSubmissionRow {
  id: string;
  subscriber_id: string;
  url: string;
  platform: Platform;
  title: string;
  country: string;
  category: string;
  status: LiveStatus;
  ends_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reject_reason: string | null;
  created_at: string;
  subscriber?: Pick<SubscriberRow, "full_name" | "business_name" | "tiktok_handle" | "email" | "paid_until" | "status" | "city" | "avatar_url" | "phone_e164">;
}

/** Live affiché dans l'annuaire. */
export interface PublicLive {
  id: string;
  kind: "ocd" | "abonne";
  title: string;
  businessName: string;
  handle: string | null;
  platform: Platform;
  url: string;
  country: string;
  countryName: string;
  category: string;
  city: string | null;
  avatarUrl: string | null;
  /** Numéro WhatsApp (chiffres, avec indicatif) ou null. */
  whatsapp: string | null;
  startedAt: string;
  endsAt: string;
}

export interface LivesNow {
  /** Réservations OCD payées en cours : toujours en tête. */
  featured: PublicLive[];
  /** Lives des abonnés validés (les plus récents d'abord). */
  lives: PublicLive[];
  /** Pays ayant au moins un live (le plus de lives d'abord). */
  countries: { code: string; slug: string; name: string; count: number }[];
  total: number;
}

const SUB_FIELDS = "full_name, business_name, tiktok_handle, email, paid_until, status, city, avatar_url, phone_e164";
const ocdHandle = () => siteConfig.socials.find((s) => s.name === "TikTok")?.href.match(/@([\w.]+)/)?.[1] ?? "ocdlive";

/* ─── Annuaire public ──────────────────────────────────────────────────── */

/** Lives en cours (mis en cache le temps d'une requête : plusieurs composants peuvent l'appeler). */
export const getLivesNow = cache(async (now = new Date()): Promise<LivesNow> => {
  const db = getServiceClient();
  if (!db) return { featured: [], lives: [], countries: [], total: 0 };
  const today = now.toISOString().slice(0, 10); // Lomé = GMT
  const time = now.toISOString().slice(11, 16);

  const [res, subs] = await Promise.all([
    db
      .from("reservations")
      .select("id, business_name, phone_country, live_date, slot_start, slot_end")
      .eq("live_date", today)
      .in("status", ["payee", "confirmee"])
      .lte("slot_start", time)
      .gt("slot_end", time),
    db
      .from("live_submissions")
      .select(`id, url, platform, title, country, category, ends_at, created_at, reviewed_at, subscriber:subscribers!inner(${SUB_FIELDS})`)
      .eq("status", "valide")
      .gt("ends_at", now.toISOString())
      .order("reviewed_at", { ascending: false }),
  ]);

  const handle = ocdHandle();
  type Res = Pick<ReservationRow, "id" | "business_name" | "phone_country" | "live_date" | "slot_start" | "slot_end">;
  const featured: PublicLive[] = ((res.data ?? []) as Res[]).map((r) => ({
    id: `ocd-${r.id}`,
    kind: "ocd",
    title: `${r.business_name} en direct sur OCD Live`,
    businessName: r.business_name,
    handle,
    platform: "tiktok",
    url: `https://www.tiktok.com/@${handle}/live`,
    country: r.phone_country,
    countryName: getCountry(r.phone_country)?.name ?? r.phone_country,
    category: DEFAULT_CATEGORY,
    city: "Studio de Lomé",
    avatarUrl: null,
    whatsapp: null,
    startedAt: `${r.live_date}T${r.slot_start}:00Z`,
    endsAt: `${r.live_date}T${r.slot_end}:00Z`,
  }));

  const lives: PublicLive[] = [];
  for (const l of (subs.data ?? []) as unknown as LiveSubmissionRow[]) {
    const s = l.subscriber;
    // Abonnement expiré ou compte suspendu : le live n'est plus affiché.
    if (!s || s.status !== "actif" || !isSubscriptionActive(s.paid_until, now)) continue;
    lives.push({
      id: l.id,
      kind: "abonne",
      title: l.title,
      businessName: s.business_name,
      handle: s.tiktok_handle,
      platform: l.platform,
      url: l.url,
      country: l.country,
      countryName: getCountry(l.country)?.name ?? l.country,
      category: l.category,
      city: s.city,
      avatarUrl: s.avatar_url,
      whatsapp: s.phone_e164 ? s.phone_e164.replace(/\D/g, "") : null,
      startedAt: l.reviewed_at ?? l.created_at,
      endsAt: l.ends_at,
    });
  }

  const counts = new Map<string, number>();
  for (const l of [...featured, ...lives]) counts.set(l.country, (counts.get(l.country) ?? 0) + 1);
  const countries = [...counts.entries()]
    .map(([code, count]) => ({ code, slug: countrySlug(code), name: getCountry(code)?.name ?? code, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));

  return { featured, lives, countries, total: featured.length + lives.length };
});

/* ─── Abonnés ──────────────────────────────────────────────────────────── */

export async function getSubscriber(id: string): Promise<SubscriberRow | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data } = await db.from("subscribers").select("*").eq("id", id).maybeSingle();
  return (data as SubscriberRow) ?? null;
}

export async function listMyLives(subscriberId: string): Promise<LiveSubmissionRow[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data } = await db.from("live_submissions").select("*").eq("subscriber_id", subscriberId).order("created_at", { ascending: false }).limit(20);
  return (data ?? []) as LiveSubmissionRow[];
}

/** Un abonné ne peut avoir qu'un live en attente ou en ligne à la fois. */
export async function getOpenLive(subscriberId: string, now = new Date()): Promise<LiveSubmissionRow | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data } = await db
    .from("live_submissions")
    .select("*")
    .eq("subscriber_id", subscriberId)
    .in("status", ["en_attente", "valide"])
    .gt("ends_at", now.toISOString())
    .limit(1)
    .maybeSingle();
  return (data as LiveSubmissionRow) ?? null;
}

/** Prévient l'équipe qu'un live attend la validation. */
export async function notifyLiveToReview(sub: SubscriberRow, live: { id: string; url: string; platform: Platform; category: string; country: string; ends_at: string }) {
  const brevo = getBrevoEnv();
  if (!brevo) return;
  await sendEmail(
    {
      template: "live-a-valider",
      to: { email: brevo.teamEmail, name: "Équipe OCD Live" },
      content: liveToReviewEmail({
        businessName: sub.business_name,
        platform: PLATFORMS[live.platform].label,
        url: live.url,
        category: getCategory(live.category)?.label ?? live.category,
        country: getCountry(live.country)?.name ?? live.country,
        endsLabel: hourLabel(new Date(live.ends_at).toISOString().slice(11, 16)),
      }),
      entity: { type: "live", id: live.id },
      actor: sub.email,
    },
    brevo,
  );
}

/* ─── Admin ────────────────────────────────────────────────────────────── */

export async function listLivesForAdmin(now = new Date()) {
  const db = getServiceClient();
  if (!db) return { pending: [], online: [], recent: [] };
  const sel = `*, subscriber:subscribers(${SUB_FIELDS})`;
  const [pending, online, recent] = await Promise.all([
    db.from("live_submissions").select(sel).eq("status", "en_attente").gt("ends_at", now.toISOString()).order("created_at"),
    db.from("live_submissions").select(sel).eq("status", "valide").gt("ends_at", now.toISOString()).order("ends_at"),
    db.from("live_submissions").select(sel).order("created_at", { ascending: false }).limit(30),
  ]);
  return {
    pending: (pending.data ?? []) as LiveSubmissionRow[],
    online: (online.data ?? []) as LiveSubmissionRow[],
    recent: (recent.data ?? []) as LiveSubmissionRow[],
  };
}

export async function listSubscribers(): Promise<SubscriberRow[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data } = await db.from("subscribers").select("*").order("created_at", { ascending: false }).limit(500);
  return (data ?? []) as SubscriberRow[];
}

export async function countPendingLives(now = new Date()): Promise<number> {
  const db = getServiceClient();
  if (!db) return 0;
  const { count } = await db
    .from("live_submissions")
    .select("id", { count: "exact", head: true })
    .eq("status", "en_attente")
    .gt("ends_at", now.toISOString());
  return count ?? 0;
}

/** Validation / refus / retrait d'un live par l'équipe (une seule fois : mise à jour conditionnelle). */
export async function reviewLive(id: string, decision: "valide" | "refuse" | "termine", admin: string, reason?: string): Promise<boolean> {
  const db = getServiceClient();
  if (!db) return false;
  const from = decision === "termine" ? ["valide"] : ["en_attente"];
  const { data } = await db
    .from("live_submissions")
    .update({ status: decision, reviewed_at: new Date().toISOString(), reviewed_by: admin, reject_reason: decision === "refuse" ? reason || null : null })
    .eq("id", id)
    .in("status", from)
    .select(`*, subscriber:subscribers(${SUB_FIELDS})`)
    .maybeSingle();
  const live = data as LiveSubmissionRow | null;
  if (!live) return false;

  const label = decision === "valide" ? "validé et affiché" : decision === "refuse" ? `refusé${reason ? ` (${reason})` : ""}` : "retiré du site";
  await logActivity({ entityType: "live", entityId: id, action: `live_${decision}`, message: `Live de ${live.subscriber?.business_name ?? "?"} ${label}.`, actor: admin });

  if (decision !== "termine" && live.subscriber?.email) {
    await sendEmail({
      template: decision === "valide" ? "live-valide" : "live-refuse",
      to: { email: live.subscriber.email, name: live.subscriber.full_name },
      content: liveReviewEmail({
        firstName: live.subscriber.full_name.split(" ")[0] ?? "",
        approved: decision === "valide",
        reason,
        countryUrl: `${siteConfig.url}/live/${countrySlug(live.country)}`,
      }),
      entity: { type: "live", id },
      actor: admin,
    });
  }
  return true;
}

/* ─── Paiement de l'abonnement (Swinmo) ────────────────────────────────── */

export const SUBSCRIPTION_REF_PREFIX = "ABO-";

export async function startSubscriptionPayment(sub: SubscriberRow): Promise<{ sessionId: string }> {
  const db = getServiceClient();
  const env = getSwinmoEnv();
  if (!db || !env) throw new Error("Paiement indisponible.");
  const reference = `${SUBSCRIPTION_REF_PREFIX}${randomBytes(4).toString("hex").toUpperCase()}`;
  const session = await createCheckoutSession({
    amount: livesConfig.subscriptionPrice,
    currency: "XOF",
    reference,
    description: `OCD Live · Abonnement annuaire ${livesConfig.subscriptionDays} jours · ${sub.business_name}`,
    country: XOF_COUNTRIES.includes(sub.country) ? sub.country : undefined,
    customer: { name: sub.full_name, email: sub.email, phone_number: sub.phone_e164 ?? undefined },
    metadata: { subscriber_id: sub.id, kind: "abonnement" },
    expiresInMinutes: 30,
  });
  const { error } = await db.from("subscription_payments").insert({
    subscriber_id: sub.id,
    environment: env.environment,
    session_id: session.id,
    reference,
    amount: livesConfig.subscriptionPrice,
    currency: "XOF",
  });
  if (error) console.error("[subscription_payments.insert]", error.message);
  await logActivity({ entityType: "subscriber", entityId: sub.id, action: "payment_started", message: "Paiement de l'abonnement ouvert.", actor: sub.email });
  return { sessionId: session.id };
}

/** Applique une charge Swinmo d'abonnement (webhook ou retour navigateur). Idempotent. */
export async function applySubscriptionCharge(charge: SwinmoCharge, source: string): Promise<ApplyResult> {
  const db = getServiceClient();
  if (!db) return "ignored";
  let q = db.from("subscription_payments").select("*");
  q = charge.checkout_session_id ? q.eq("session_id", charge.checkout_session_id) : q.eq("reference", charge.reference);
  const { data: payment } = await q.maybeSingle<{ id: string; subscriber_id: string; reference: string; amount: number; currency: string }>();
  if (!payment) return "ignored";

  if (charge.reference !== payment.reference || charge.amount !== payment.amount || charge.currency !== payment.currency) {
    await logActivity({
      entityType: "subscriber",
      entityId: payment.subscriber_id,
      action: "payment_anomaly",
      message: `⚠️ Paiement d'abonnement incohérent ignoré (${charge.amount} ${charge.currency}).`,
      meta: { charge_id: charge.id },
    });
    return "mismatch";
  }

  const details = {
    charge_id: charge.id,
    fee: charge.fee ?? null,
    net: charge.net ?? null,
    operator: charge.payment_method?.operator ?? null,
    failure_reason: charge.failure_reason ?? null,
    raw: charge,
  };
  if (charge.status === "processing") {
    await db.from("subscription_payments").update({ ...details, status: "processing" }).eq("id", payment.id).neq("status", "succeeded");
    return "processing";
  }
  if (charge.status === "failed") {
    await db.from("subscription_payments").update({ ...details, status: "failed" }).eq("id", payment.id).not("status", "in", "(succeeded,failed)");
    return "failed";
  }

  const { data: won } = await db
    .from("subscription_payments")
    .update({ ...details, status: "succeeded", paid_at: charge.paid_at ?? new Date().toISOString() })
    .eq("id", payment.id)
    .neq("status", "succeeded")
    .select("id");
  if (!won?.length) return "already";

  const sub = await getSubscriber(payment.subscriber_id);
  if (!sub) return "fulfilled";
  const paidUntil = extendSubscription(sub.paid_until).toISOString();
  await db.from("subscribers").update({ paid_until: paidUntil }).eq("id", sub.id);
  await db.from("subscription_payments").update({ period_end: paidUntil }).eq("id", payment.id);
  await logActivity({
    entityType: "subscriber",
    entityId: sub.id,
    action: "payment_succeeded",
    message: `💳 Abonnement payé (${charge.amount} ${charge.currency} via ${operatorLabel(charge.payment_method?.operator)}) · actif jusqu'au ${paidUntil.slice(0, 10)} · ${source}.`,
    actor: "Swinmo Pay",
  });
  await sendEmail({
    template: "abonnement-paye",
    to: { email: sub.email, name: sub.full_name },
    content: subscriptionPaidEmail({ firstName: sub.full_name.split(" ")[0] ?? "", paidUntil, amount: charge.amount }),
    entity: { type: "subscriber", id: sub.id },
  });
  return "fulfilled";
}
