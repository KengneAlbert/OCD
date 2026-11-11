/**
 * Règles PURES de l'annuaire des lives (testables) : créneaux de validation,
 * lecture des liens de live TikTok, durée d'affichage, abonnement, adresses des pages.
 */
import { countries, getCountry } from "@/config/countries";
import { livesConfig } from "@/config/lives";

/* ─── Heures et créneaux (heure de Lomé = UTC) ─────────────────────────── */

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  return h * 60 + m;
};
/** Minutes écoulées depuis minuit, heure de Lomé (= UTC). */
const lomeMinutes = (now: Date) => now.getUTCHours() * 60 + now.getUTCMinutes();
const atLome = (now: Date, hhmm: string, dayOffset = 0) => {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + dayOffset * 86_400_000 + toMinutes(hhmm) * 60_000);
};

/** « 08:00 » → « 8h00 ». */
export const hourLabel = (hhmm: string) => {
  const [h, m] = hhmm.split(":");
  return `${Number(h)}h${m ?? "00"}`;
};
export type Window = { readonly start: string; readonly end: string };
export const windowLabel = (w: Window) => `${hourLabel(w.start)}–${hourLabel(w.end)}`;
export const windowsLabel = () => livesConfig.validationWindows.map(windowLabel).join(" et ");

/** Créneau de validation en cours, ou null. */
export function currentWindow(now: Date): Window | null {
  const m = lomeMinutes(now);
  return livesConfig.validationWindows.find((w) => m >= toMinutes(w.start) && m < toMinutes(w.end)) ?? null;
}

/** Début du prochain créneau (aujourd'hui ou demain). */
export function nextWindowStart(now: Date): Date {
  const m = lomeMinutes(now);
  const today = livesConfig.validationWindows.find((w) => toMinutes(w.start) > m);
  return today ? atLome(now, today.start) : atLome(now, livesConfig.validationWindows[0].start, 1);
}

/** « aujourd'hui à 18h00 », « demain à 8h00 ». */
export function nextWindowLabel(now: Date): string {
  const start = nextWindowStart(now);
  const sameDay = start.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  return `${sameDay ? "aujourd'hui" : "demain"} à ${hourLabel(start.toISOString().slice(11, 16))}`;
}

/** 8 040 000 ms → « 2h14 » ; 840 000 → « 14 min ». */
export function durationLabel(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
}

/** « depuis 25 min », « depuis 1h10 ». */
export const sinceLabel = (startIso: string, now = new Date()) => `depuis ${durationLabel(now.getTime() - new Date(startIso).getTime())}`;

/** Fin d'affichage d'un live envoyé maintenant : fin du créneau + délai. Null hors créneau. */
export function liveExpiry(now: Date): Date | null {
  const w = currentWindow(now);
  return w ? new Date(atLome(now, w.end).getTime() + livesConfig.graceMinutes * 60_000) : null;
}

/* ─── Liens de live ────────────────────────────────────────────────────── */

/** L'annuaire n'accepte que les lives TikTok. */
export type Platform = "tiktok";

export const PLATFORMS: Record<Platform, { label: string; app: string }> = {
  tiktok: { label: "TikTok", app: "TikTok" },
};

/** tiktok.com (www., m.) et liens courts de partage (vm., vt.). */
const TIKTOK_HOST = /^((www|m)\.)?tiktok\.com$/;
const TIKTOK_SHORT = /^(vm|vt)\.tiktok\.com$/;

export interface LiveLink {
  platform: Platform;
  url: string;
  /** Compte lu dans le lien (null pour les liens courts). */
  handle: string | null;
}

/**
 * Valide un lien de live TikTok et le nettoie (accepte aussi le texte de partage complet).
 * Retourne null pour tout autre site, ou pour une vidéo TikTok (pas un live).
 */
export function parseLiveUrl(input: string): LiveLink | null {
  const raw = input.trim().split(/\s+/).find((w) => /[a-z0-9]\.[a-z]/i.test(w)) ?? "";
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (TIKTOK_SHORT.test(host)) {
    return url.pathname.replace(/\/+$/, "") ? { platform: "tiktok", url: `https://${host}${url.pathname}`, handle: null } : null;
  }
  if (!TIKTOK_HOST.test(host)) return null;
  const match = url.pathname.match(/^\/@([A-Za-z0-9._]{2,24})(?:\/live)?\/?$/);
  if (!match) return null; // vidéo, page « Pour toi »… : pas un live
  const handle = match[1]!.toLowerCase();
  return { platform: "tiktok", url: `https://www.tiktok.com/@${handle}/live`, handle };
}

/** Nettoie un identifiant saisi (« @Boutique.Ama » → « boutique.ama »). */
export function normalizeHandle(input: string): string | null {
  const h = input.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, "").replace(/\/.*$/, "").toLowerCase();
  return /^[a-z0-9._]{2,24}$/.test(h) ? h : null;
}

/* ─── Abonnement ───────────────────────────────────────────────────────── */

export const isSubscriptionActive = (paidUntil: string | null | undefined, now = new Date()) =>
  Boolean(paidUntil && new Date(paidUntil) > now);

/** Nouvelle fin d'abonnement : on prolonge à partir de la fin actuelle si elle est dans le futur. */
export function extendSubscription(paidUntil: string | null | undefined, now = new Date()): Date {
  const base = paidUntil && new Date(paidUntil) > now ? new Date(paidUntil) : now;
  return new Date(base.getTime() + livesConfig.subscriptionDays * 86_400_000);
}

/* ─── Adresses des pages pays ──────────────────────────────────────────── */

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** « CI » → « cote-d-ivoire ». */
export const countrySlug = (code: string) => slugify(getCountry(code)?.name ?? code);
/** « cote-d-ivoire » → pays. */
export const countryFromSlug = (slug: string) => countries.find((c) => slugify(c.name) === slug);

/** « 2 lives », « 1 live ». */
export const livesCount = (n: number) => `${n} live${n > 1 ? "s" : ""}`;

/** « au Togo », « en Côte d'Ivoire », « aux Comores ». */
export function inCountry(name: string): string {
  if (/^(Comores|Seychelles)$/.test(name)) return `aux ${name}`;
  if (/^(Mozambique|Zimbabwe|Cap-Vert)$/.test(name)) return `au ${name}`;
  if (/^[AEIOUÉÈ]/i.test(name) || /e$/.test(name) || name.startsWith("RD ")) return `en ${name}`;
  return `au ${name}`;
}
