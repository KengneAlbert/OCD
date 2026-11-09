import "server-only";
import type { CandidatureStatus, ReservationStatus } from "@/lib/admin/status";
import { getServiceClient } from "@/lib/supabase/admin";
import { releaseExpiredHolds } from "./holds";
import type { ActivityRow, CandidatureRow, EmailLogRow, ReservationRow } from "./types";

export const PAGE_SIZE = 25;

export interface ReservationFilters {
  q?: string;
  status?: ReservationStatus;
  type?: "presentiel" | "distance";
  from?: string;
  to?: string;
  page?: number;
  /** "live" = tri par date du live, sinon par date de création. */
  sort?: "live" | "created";
}

/** Nettoie une recherche libre pour un filtre PostgREST `or`. */
const sanitize = (q: string) => q.replace(/[%,()*\\]/g, " ").trim().slice(0, 60);

export async function listReservations(f: ReservationFilters) {
  const db = getServiceClient();
  if (!db) return { rows: [] as ReservationRow[], count: 0 };
  await releaseExpiredHolds();
  const page = Math.max(1, f.page ?? 1);
  let query = db.from("reservations").select("*", { count: "exact" });
  // Pas de réservation sans paiement : les tentatives non payées n'apparaissent que sur demande.
  query = f.status ? query.eq("status", f.status) : query.not("status", "in", "(nouvelle,expiree)");
  if (f.type) query = query.eq("live_type", f.type);
  if (f.from) query = query.gte("live_date", f.from);
  if (f.to) query = query.lte("live_date", f.to);
  if (f.q) {
    const q = sanitize(f.q);
    if (q) query = query.or(`reference.ilike.%${q}%,full_name.ilike.%${q}%,business_name.ilike.%${q}%,phone_e164.ilike.%${q.replace(/\D/g, "") || q}%,email.ilike.%${q}%`);
  }
  query =
    f.sort === "live"
      ? query.order("live_date", { ascending: true }).order("slot_start", { ascending: true })
      : query.order("created_at", { ascending: false });
  const { data, count, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) console.error("[admin.listReservations]", error.message);
  return { rows: (data ?? []) as ReservationRow[], count: count ?? 0 };
}

/** Toutes les réservations filtrées (export CSV, plafonné). */
export async function exportReservations(f: ReservationFilters) {
  const db = getServiceClient();
  if (!db) return [] as ReservationRow[];
  let query = db.from("reservations").select("*");
  // Pas de réservation sans paiement : les tentatives non payées n'apparaissent que sur demande.
  query = f.status ? query.eq("status", f.status) : query.not("status", "in", "(nouvelle,expiree)");
  if (f.type) query = query.eq("live_type", f.type);
  if (f.from) query = query.gte("live_date", f.from);
  if (f.to) query = query.lte("live_date", f.to);
  const { data } = await query.order("live_date", { ascending: true }).limit(5000);
  return (data ?? []) as ReservationRow[];
}

export interface CandidatureFilters {
  q?: string;
  status?: CandidatureStatus;
  page?: number;
}

export async function listCandidatures(f: CandidatureFilters) {
  const db = getServiceClient();
  if (!db) return { rows: [] as CandidatureRow[], count: 0 };
  const page = Math.max(1, f.page ?? 1);
  let query = db.from("candidatures").select("*", { count: "exact" });
  if (f.status) query = query.eq("status", f.status);
  if (f.q) {
    const q = sanitize(f.q);
    if (q) query = query.or(`reference.ilike.%${q}%,full_name.ilike.%${q}%,location.ilike.%${q}%,phone_e164.ilike.%${q}%`);
  }
  const { data, count, error } = await query.order("created_at", { ascending: false }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) console.error("[admin.listCandidatures]", error.message);
  return { rows: (data ?? []) as CandidatureRow[], count: count ?? 0 };
}

export async function getEntityActivity(entityType: "reservation" | "candidature", id: string) {
  const db = getServiceClient();
  if (!db) return [] as ActivityRow[];
  const { data } = await db
    .from("activity_log")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as ActivityRow[];
}

export async function getEntityEmails(entityType: "reservation" | "candidature", id: string) {
  const db = getServiceClient();
  if (!db) return [] as EmailLogRow[];
  const { data } = await db
    .from("email_log")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", id)
    .order("created_at", { ascending: false });
  return (data ?? []) as EmailLogRow[];
}

export async function listActivity(page = 1) {
  const db = getServiceClient();
  if (!db) return { rows: [] as ActivityRow[], count: 0 };
  const { data, count } = await db
    .from("activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * 50, page * 50 - 1);
  return { rows: (data ?? []) as ActivityRow[], count: count ?? 0 };
}

export async function listEmailLog(page = 1, status?: "sent" | "failed") {
  const db = getServiceClient();
  if (!db) return { rows: [] as EmailLogRow[], count: 0 };
  let query = db.from("email_log").select("*", { count: "exact" });
  if (status) query = query.eq("status", status);
  const { data, count } = await query.order("created_at", { ascending: false }).range((page - 1) * 50, page * 50 - 1);
  return { rows: (data ?? []) as EmailLogRow[], count: count ?? 0 };
}
