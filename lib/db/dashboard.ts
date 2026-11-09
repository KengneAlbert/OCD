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

export const PERIODS = {
  "7j": { label: "7 jours", long: "7 derniers jours", previous: "vs 7 jours précédents" },
  "30j": { label: "30 jours", long: "30 derniers jours", previous: "vs 30 jours précédents" },
  mois: { label: "Mois", long: "ce mois-ci", previous: "vs mois dernier" },
  annee: { label: "Année", long: "cette année", previous: "vs année dernière" },
} as const;
export type Period = keyof typeof PERIODS;
export const isPeriod = (v: unknown): v is Period => typeof v === "string" && v in PERIODS;

export interface Breakdown {
  key: string;
  label: string;
  count: number;
  revenue: number;
}

export interface DashboardData {
  period: Period;
  periodLabel: string;
  byStatus: Record<ReservationStatus, number>;
  current: { revenue: number; net: number; fees: number; paid: number };
  previous: { revenue: number; paid: number };
  allTimeRevenue: number;
  averageBasket: number;
  conversion: { rate: number | null; paid: number; attempts: number };
  occupancy30d: { rate: number; booked: number; capacity: number };
  next7Days: number;
  noShowRate: number | null;
  emailsFailed7d: number;
  upcoming: ReservationRow[];
  latest: ReservationRow[];
  /** Barres du graphique : par jour (7 j, 30 j, mois) ou par mois (année). */
  chart: { key: string; label: string; amount: number; count: number }[];
  chartUnit: "jour" | "mois";
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

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10); // Lomé = GMT
const parse = (k: string) => new Date(`${k}T00:00:00Z`);
const addDays = (k: string, n: number) => dayKey(new Date(parse(k).getTime() + n * DAY));
const paidDay = (p: PayRow) => (p.paid_at ?? p.created_at).slice(0, 10);
const sum = <T,>(list: T[], f: (x: T) => number) => list.reduce((t, x) => t + f(x), 0);

/** Bornes [début, fin] incluses de la période et de la période précédente comparable. */
function ranges(period: Period, today: string) {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  switch (period) {
    case "7j":
      return { start: addDays(today, -6), prevStart: addDays(today, -13), prevEnd: addDays(today, -7) };
    case "30j":
      return { start: addDays(today, -29), prevStart: addDays(today, -59), prevEnd: addDays(today, -30) };
    case "mois": {
      const start = `${today.slice(0, 7)}-01`;
      const prevStart = dayKey(new Date(Date.UTC(y, m - 2, 1)));
      return { start, prevStart, prevEnd: addDays(start, -1) };
    }
    case "annee":
      // Même période l'an dernier (1er janvier → même jour), pour une comparaison juste.
      return { start: `${y}-01-01`, prevStart: `${y - 1}-01-01`, prevEnd: `${y - 1}${today.slice(4)}` };
  }
}

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

export async function getDashboard(today: string, period: Period = "mois"): Promise<DashboardData | null> {
  const db = getServiceClient();
  if (!db) return null;
  await releaseExpiredHolds();

  const { start, prevStart, prevEnd } = ranges(period, today);
  const in30 = addDays(today, 29);
  const in7 = addDays(today, 6);

  const [all, payments, upcoming, latest, failed] = await Promise.all([
    db.from("reservations").select("status, package_id, package_name, package_price, live_type, live_date, category, phone_country, created_at").limit(20000),
    db.from("payments").select("amount, fee, net, operator, paid_at, created_at").eq("status", "succeeded").limit(20000),
    db.from("reservations").select("*").gte("live_date", today).in("status", ["confirmee", "payee"]).order("live_date").order("slot_start").limit(8),
    db.from("reservations").select("*").in("status", ["payee", "realisee", "absente", "confirmee"]).order("updated_at", { ascending: false }).limit(6),
    db.from("email_log").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", new Date(Date.now() - 7 * DAY).toISOString()),
  ]);

  const rows = (all.data ?? []) as DashRow[];
  const pays = (payments.data ?? []) as PayRow[];
  const inRange = (k: string, a: string, b: string) => k >= a && k <= b;

  const byStatus = { nouvelle: 0, confirmee: 0, payee: 0, realisee: 0, annulee: 0, absente: 0, expiree: 0 } as Record<ReservationStatus, number>;
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  // Chiffre d'affaires : paiements en ligne encaissés, à la date du paiement.
  const cur = pays.filter((p) => inRange(paidDay(p), start, today));
  const prev = pays.filter((p) => inRange(paidDay(p), prevStart, prevEnd));

  // Réservations payées créées sur la période (répartitions, panier moyen).
  const created = (r: DashRow) => r.created_at.slice(0, 10);
  const paidInPeriod = rows.filter((r) => PAID.has(r.status) && inRange(created(r), start, today));

  // Conversion : tentatives de la période (hors créneaux encore en cours de paiement).
  const attempts = rows.filter((r) => inRange(created(r), start, today) && r.status !== "nouvelle");
  const converted = attempts.filter((r) => PAID.has(r.status) || r.status === "confirmee").length;

  // Remplissage : créneaux ouverts sur les 30 prochains jours (1 live par créneau).
  const slotsPerDay = generateDailySlots().length;
  let capacity = 0;
  for (let d = 0; d < 30; d++) if (isDateOpen(addDays(today, d))) capacity += slotsPerDay;
  const booked = rows.filter((r) => BOOKED.has(r.status) && inRange(r.live_date, today, in30)).length;

  // Graphique.
  const chartUnit = period === "annee" ? "mois" : "jour";
  const buckets = new Map<string, { amount: number; count: number }>();
  for (const p of cur) {
    const k = chartUnit === "mois" ? paidDay(p).slice(0, 7) : paidDay(p);
    const v = buckets.get(k) ?? { amount: 0, count: 0 };
    v.amount += p.amount;
    v.count += 1;
    buckets.set(k, v);
  }
  const keys: string[] = [];
  if (chartUnit === "mois") for (let mo = 1; mo <= Number(today.slice(5, 7)); mo++) keys.push(`${today.slice(0, 4)}-${String(mo).padStart(2, "0")}`);
  else for (let k = start; k <= today; k = addDays(k, 1)) keys.push(k);
  const chart = keys.map((key) => ({
    key,
    label:
      chartUnit === "mois"
        ? parse(`${key}-01`).toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" })
        : parse(key).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }),
    ...(buckets.get(key) ?? { amount: 0, count: 0 }),
  }));

  const done = byStatus.realisee + byStatus.absente;
  const price = (r: DashRow) => r.package_price;
  const periodLabel =
    period === "mois"
      ? parse(start).toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" })
      : period === "annee"
        ? `année ${today.slice(0, 4)}`
        : PERIODS[period].long;

  return {
    period,
    periodLabel,
    byStatus,
    current: {
      revenue: sum(cur, (p) => p.amount),
      fees: sum(cur, (p) => p.fee ?? 0),
      net: sum(cur, (p) => p.net ?? p.amount - (p.fee ?? 0)),
      paid: cur.length,
    },
    previous: { revenue: sum(prev, (p) => p.amount), paid: prev.length },
    allTimeRevenue: sum(pays, (p) => p.amount),
    averageBasket: paidInPeriod.length ? Math.round(sum(paidInPeriod, price) / paidInPeriod.length) : 0,
    conversion: { rate: attempts.length ? converted / attempts.length : null, paid: converted, attempts: attempts.length },
    occupancy30d: { rate: capacity ? booked / capacity : 0, booked, capacity },
    next7Days: rows.filter((r) => (r.status === "payee" || r.status === "confirmee") && inRange(r.live_date, today, in7)).length,
    noShowRate: done ? byStatus.absente / done : null,
    emailsFailed7d: failed.count ?? 0,
    upcoming: (upcoming.data ?? []) as ReservationRow[],
    latest: (latest.data ?? []) as ReservationRow[],
    chart,
    chartUnit,
    byPackage: group(paidInPeriod, (r) => r.package_id, (k) => paidInPeriod.find((r) => r.package_id === k)?.package_name ?? k, price),
    byType: group(paidInPeriod, (r) => r.live_type, (k) => (k === "presentiel" ? "Au studio" : "À distance"), price),
    byCountry: group(paidInPeriod, (r) => r.phone_country, (k) => getCountry(k)?.name ?? k, price),
    byCategory: group(paidInPeriod, (r) => r.category, (k) => getCategoryLabel(k), price),
    byOperator: group(cur, (p) => p.operator ?? "autre", (k) => operatorLabel(k === "autre" ? null : k), (p) => p.amount),
  };
}
