import "server-only";
import { getCategoryLabel } from "@/config/categories";
import { getCountry } from "@/config/countries";
import type { ReservationStatus } from "@/lib/admin/status";
import { operatorLabel } from "@/lib/payments/swinmo";
import { generateDailySlots, isDateOpen } from "@/lib/schedule";
import { getServiceClient } from "@/lib/supabase/admin";
import { releaseExpiredHolds } from "./holds";
import type { ReservationRow } from "./types";

/** Réservations réellement payées (en ligne ou à la main), lives passés compris. */
const PAID = new Set<ReservationStatus>(["payee", "realisee", "absente"]);
/** Réservations qui occupent un créneau à venir. */
const BOOKED = new Set<ReservationStatus>(["nouvelle", "confirmee", "payee"]);

export interface Breakdown {
  key: string;
  label: string;
  count: number;
  revenue: number;
}

export interface DashboardData {
  byStatus: Record<ReservationStatus, number>;
  month: { label: string; revenue: number; net: number; fees: number; paid: number; prevRevenue: number; prevPaid: number };
  allTime: { revenue: number; paid: number };
  averageBasket: number;
  conversion30d: { rate: number | null; paid: number; attempts: number };
  occupancy30d: { rate: number; booked: number; capacity: number };
  next7Days: number;
  noShowRate: number | null;
  emailsFailed7d: number;
  upcoming: ReservationRow[];
  latest: ReservationRow[];
  revenue30Days: { date: string; amount: number; count: number }[];
  byPackage: Breakdown[];
  byType: Breakdown[];
  byCountry: Breakdown[];
  byCategory: Breakdown[];
  byOperator: Breakdown[];
}

type DashRow = Pick<
  ReservationRow,
  "status" | "package_id" | "package_name" | "package_price" | "live_type" | "live_date" | "category" | "phone_country" | "created_at"
>;
type PayRow = { amount: number; fee: number | null; net: number | null; operator: string | null; paid_at: string | null; created_at: string };

const dayKey = (d: Date) => d.toISOString().slice(0, 10); // Lomé = GMT
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const paidDay = (p: PayRow) => (p.paid_at ?? p.created_at).slice(0, 10);
const sum = <T,>(list: T[], f: (x: T) => number) => list.reduce((t, x) => t + f(x), 0);

function group<T>(items: T[], key: (x: T) => string, label: (k: string) => string, amount: (x: T) => number, limit = 6): Breakdown[] {
  const map = new Map<string, Breakdown>();
  for (const x of items) {
    const k = key(x);
    const b = map.get(k) ?? { key: k, label: label(k), count: 0, revenue: 0 };
    b.count += 1;
    b.revenue += amount(x);
    map.set(k, b);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue || b.count - a.count).slice(0, limit);
}

export async function getDashboard(today: string): Promise<DashboardData | null> {
  const db = getServiceClient();
  if (!db) return null;
  await releaseExpiredHolds();

  const now = new Date();
  const monthStart = `${today.slice(0, 7)}-01`;
  const prevMonthStart = dayKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));
  const in30 = dayKey(addDays(now, 29));
  const in7 = dayKey(addDays(now, 6));
  const ago30 = addDays(now, -29);
  ago30.setUTCHours(0, 0, 0, 0);

  const [all, payments, upcoming, latest, failed] = await Promise.all([
    db.from("reservations").select("status, package_id, package_name, package_price, live_type, live_date, category, phone_country, created_at").limit(20000),
    db.from("payments").select("amount, fee, net, operator, paid_at, created_at").eq("status", "succeeded").limit(20000),
    db.from("reservations").select("*").gte("live_date", today).in("status", ["confirmee", "payee"]).order("live_date").order("slot_start").limit(8),
    db.from("reservations").select("*").in("status", ["payee", "realisee", "absente", "confirmee"]).order("updated_at", { ascending: false }).limit(6),
    db.from("email_log").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", addDays(now, -7).toISOString()),
  ]);

  const rows = (all.data ?? []) as DashRow[];
  const pays = (payments.data ?? []) as PayRow[];

  const byStatus = { nouvelle: 0, confirmee: 0, payee: 0, realisee: 0, annulee: 0, absente: 0, expiree: 0 } as Record<ReservationStatus, number>;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  const paidRows = rows.filter((r) => PAID.has(r.status));

  // Chiffre d'affaires : paiements en ligne encaissés, à la date du paiement.
  const inMonth = pays.filter((p) => paidDay(p) >= monthStart);
  const inPrev = pays.filter((p) => paidDay(p) >= prevMonthStart && paidDay(p) < monthStart);

  // Conversion : tentatives des 30 derniers jours (hors créneaux encore en cours de paiement).
  const recent = rows.filter((r) => new Date(r.created_at) >= ago30 && r.status !== "nouvelle");
  const recentPaid = recent.filter((r) => PAID.has(r.status) || r.status === "confirmee").length;

  // Remplissage : créneaux ouverts sur les 30 prochains jours (1 live par créneau).
  const slotsPerDay = generateDailySlots().length;
  let capacity = 0;
  for (let d = 0; d < 30; d++) if (isDateOpen(dayKey(addDays(now, d)))) capacity += slotsPerDay;
  const booked = rows.filter((r) => BOOKED.has(r.status) && r.live_date >= today && r.live_date <= in30).length;

  const perDay = new Map<string, { amount: number; count: number }>();
  for (const p of pays) {
    const v = perDay.get(paidDay(p)) ?? { amount: 0, count: 0 };
    v.amount += p.amount;
    v.count += 1;
    perDay.set(paidDay(p), v);
  }

  const done = byStatus.realisee + byStatus.absente;
  const price = (r: DashRow) => r.package_price;

  return {
    byStatus,
    month: {
      label: new Date(`${monthStart}T00:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }),
      revenue: sum(inMonth, (p) => p.amount),
      fees: sum(inMonth, (p) => p.fee ?? 0),
      net: sum(inMonth, (p) => p.net ?? p.amount - (p.fee ?? 0)),
      paid: inMonth.length,
      prevRevenue: sum(inPrev, (p) => p.amount),
      prevPaid: inPrev.length,
    },
    allTime: { revenue: sum(pays, (p) => p.amount), paid: paidRows.length },
    averageBasket: paidRows.length ? Math.round(sum(paidRows, price) / paidRows.length) : 0,
    conversion30d: { rate: recent.length ? recentPaid / recent.length : null, paid: recentPaid, attempts: recent.length },
    occupancy30d: { rate: capacity ? booked / capacity : 0, booked, capacity },
    next7Days: rows.filter((r) => (r.status === "payee" || r.status === "confirmee") && r.live_date >= today && r.live_date <= in7).length,
    noShowRate: done ? byStatus.absente / done : null,
    emailsFailed7d: failed.count ?? 0,
    upcoming: (upcoming.data ?? []) as ReservationRow[],
    latest: (latest.data ?? []) as ReservationRow[],
    revenue30Days: Array.from({ length: 30 }, (_, i) => {
      const date = dayKey(addDays(ago30, i));
      return { date, ...(perDay.get(date) ?? { amount: 0, count: 0 }) };
    }),
    byPackage: group(paidRows, (r) => r.package_id, (k) => paidRows.find((r) => r.package_id === k)?.package_name ?? k, price),
    byType: group(paidRows, (r) => r.live_type, (k) => (k === "presentiel" ? "Au studio" : "À distance"), price),
    byCountry: group(paidRows, (r) => r.phone_country, (k) => getCountry(k)?.name ?? k, price),
    byCategory: group(paidRows, (r) => r.category, (k) => getCategoryLabel(k), price),
    byOperator: group(pays, (p) => p.operator ?? "autre", (k) => operatorLabel(k === "autre" ? null : k), (p) => p.amount),
  };
}
