import "server-only";
import { createHash } from "node:crypto";
import { getCountry } from "@/config/countries";
import { siteConfig } from "@/config/site";
import { getPackage } from "@/config/packages";
import type { ReservationStatus } from "@/lib/admin/status";
import type { ReservationLike } from "@/lib/emails/templates";
import { getServiceClient } from "@/lib/supabase/admin";
import { digitsOnly } from "@/lib/utils";
import type { Candidature, Reservation } from "@/types";
import { logActivity } from "./activity";
import type { CandidatureRow, ReservationRow } from "./types";

export const hashIp = (ip: string) => createHash("sha256").update(`${ip}:${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex").slice(0, 32);

export const toE164 = (country: string, number: string) => `${getCountry(country)?.dialCode ?? ""}${digitsOnly(number)}`;

/* ─── Réservations ─────────────────────────────────────────────────────── */

export type InsertResult = { ok: true; id: string; payToken?: string } | { ok: false; reason: "slot_taken" | "duplicate" | "error"; message?: string };

export async function insertReservation(
  r: Reservation,
  meta: { channel: string; ip?: string; userAgent?: string | null; timezone?: string },
): Promise<InsertResult | null> {
  const db = getServiceClient();
  if (!db) return null;
  const pkg = getPackage(r.packageId);
  const i = r.info;
  const { data, error } = await db
    .from("reservations")
    .insert({
      reference: r.reference,
      live_type: r.liveType,
      live_date: r.date,
      slot_start: r.slotStart,
      slot_end: r.slotEnd,
      package_id: r.packageId,
      package_name: pkg?.name ?? r.packageId,
      package_price: pkg?.price ?? 0,
      full_name: i.fullName,
      business_name: i.businessName,
      category: i.category,
      category_other: i.categoryOther || null,
      product_description: i.productDescription,
      product_count: i.productCount || null,
      phone_country: i.phoneCountry,
      phone_number: i.phoneNumber,
      phone_e164: toE164(i.phoneCountry, i.phoneNumber),
      email: i.email || null,
      country: i.country || null,
      city: i.city || null,
      shop_address: i.shopAddress || null,
      tiktok: i.tiktok || null,
      facebook: i.facebook || null,
      instagram: i.instagram || null,
      special_needs: i.specialNeeds || null,
      visitor_timezone: meta.timezone ?? null,
      channel: meta.channel,
      payload: r,
      ip_hash: meta.ip ? hashIp(meta.ip) : null,
      user_agent: meta.userAgent?.slice(0, 300) ?? null,
    })
    .select("*")
    .single();

  if (error) {
    // 23505 = violation d'unicité : créneau déjà pris ou référence en double.
    if (error.code === "23505") {
      return { ok: false, reason: error.message.includes("slot") ? "slot_taken" : "duplicate" };
    }
    console.error("[reservations.insert]", error.message);
    return { ok: false, reason: "error", message: error.message };
  }

  await logActivity({
    entityType: "reservation",
    entityId: data.id,
    action: "created",
    message: `Réservation ${r.reference} créée depuis le site (${pkg?.name ?? r.packageId}).`,
    meta: { channel: meta.channel },
    actor: i.fullName,
  });
  return { ok: true, id: data.id as string, payToken: (data as { pay_token?: string }).pay_token };
}

/** Créneaux déjà réservés (hors annulations) entre deux dates incluses. */
export async function getTakenSlots(from: string, to: string): Promise<{ date: string; slotStart: string }[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db
    .from("reservations")
    .select("live_date, slot_start")
    .gte("live_date", from)
    .lte("live_date", to)
    .neq("status", "annulee");
  if (error) {
    console.error("[reservations.taken]", error.message);
    return [];
  }
  return (data ?? []).map((d) => ({ date: d.live_date as string, slotStart: d.slot_start as string }));
}

export async function isSlotTaken(date: string, slotStart: string): Promise<boolean> {
  const taken = await getTakenSlots(date, date);
  return taken.some((t) => t.slotStart === slotStart);
}

export function rowToReservationLike(row: ReservationRow): ReservationLike {
  return {
    reference: row.reference,
    liveType: row.live_type,
    date: row.live_date,
    slotStart: row.slot_start,
    slotEnd: row.slot_end,
    packageId: row.package_id,
    packageName: row.package_name,
    packagePrice: row.package_price,
    fullName: row.full_name,
    businessName: row.business_name,
    email: row.email,
    phoneCountry: row.phone_country,
    phoneNumber: row.phone_number,
    category: row.category,
    categoryOther: row.category_other,
    productDescription: row.product_description,
    productCount: row.product_count,
    country: row.country,
    city: row.city,
    shopAddress: row.shop_address,
    tiktok: row.tiktok,
    facebook: row.facebook,
    instagram: row.instagram,
    specialNeeds: row.special_needs,
    payUrl: row.pay_token && process.env.SWINMO_SECRET_KEY ? `${siteConfig.url}/paiement/${row.pay_token}` : undefined,
  };
}

export async function getReservation(id: string): Promise<ReservationRow | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data } = await db.from("reservations").select("*").eq("id", id).maybeSingle();
  return (data as ReservationRow) ?? null;
}

export async function setReservationStatus(id: string, status: ReservationStatus) {
  const db = getServiceClient();
  if (!db) throw new Error("Supabase non configuré");
  const { error } = await db.from("reservations").update({ status }).eq("id", id);
  if (error) throw new Error(error.code === "23505" ? "Ce créneau est déjà occupé par une autre réservation active." : error.message);
}

/* ─── Candidatures ─────────────────────────────────────────────────────── */

export async function insertCandidature(c: Candidature, meta: { ip?: string }): Promise<InsertResult | null> {
  const db = getServiceClient();
  if (!db) return null;
  const d = c.data;
  const { data, error } = await db
    .from("candidatures")
    .insert({
      reference: c.reference,
      full_name: d.fullName,
      age: Number(d.age) || null,
      location: d.location,
      phone_country: d.phoneCountry,
      phone_number: d.phoneNumber,
      phone_e164: toE164(d.phoneCountry, d.phoneNumber),
      email: d.email || null,
      languages: [...d.languages, ...(d.otherLanguages ? [d.otherLanguages] : [])],
      availability: d.availability,
      has_sales_experience: d.hasSalesExperience === "oui",
      experience_details: d.experienceDetails || null,
      video_url: d.videoUrl || null,
      motivation: d.motivation,
      payload: c,
      ip_hash: meta.ip ? hashIp(meta.ip) : null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, reason: "duplicate" };
    console.error("[candidatures.insert]", error.message);
    return { ok: false, reason: "error", message: error.message };
  }
  await logActivity({
    entityType: "candidature",
    entityId: data.id,
    action: "created",
    message: `Candidature ${c.reference} reçue depuis le site.`,
    actor: d.fullName,
  });
  return { ok: true, id: data.id as string };
}

export async function getCandidature(id: string): Promise<CandidatureRow | null> {
  const db = getServiceClient();
  if (!db) return null;
  const { data } = await db.from("candidatures").select("*").eq("id", id).maybeSingle();
  return (data as CandidatureRow) ?? null;
}

export function rowToCandidatureLike(row: CandidatureRow) {
  return {
    reference: row.reference,
    fullName: row.full_name,
    email: row.email,
    age: row.age,
    location: row.location,
    phoneCountry: row.phone_country,
    phoneNumber: row.phone_number,
    languages: row.languages,
    availability: row.availability,
    hasSalesExperience: row.has_sales_experience,
    experienceDetails: row.experience_details,
    videoUrl: row.video_url,
    motivation: row.motivation,
  };
}
