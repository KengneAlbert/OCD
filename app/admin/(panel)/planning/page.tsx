import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Wifi } from "lucide-react";
import { PageTitle } from "@/components/admin/ui";
import { scheduleConfig } from "@/config/schedule";
import { reservationStatusMeta, toneClasses, type ReservationStatus } from "@/lib/admin/status";
import { releaseExpiredHolds } from "@/lib/db/holds";
import type { ReservationRow } from "@/lib/db/types";
import { formatTimeFr, generateDailySlots, isDateOpen } from "@/lib/schedule";
import { getServiceClient } from "@/lib/supabase/admin";
import { cn, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Planning" };
export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10); // Lomé = GMT
const parse = (k: string) => new Date(`${k}T00:00:00Z`);

/** Lundi de la semaine contenant la date (UTC = heure de Lomé). */
function mondayOf(key: string): string {
  const d = parse(key);
  const shift = (d.getUTCDay() + 6) % 7;
  return dayKey(new Date(d.getTime() - shift * DAY_MS));
}

const SHOWN: ReservationStatus[] = ["nouvelle", "confirmee", "payee", "realisee", "absente"];
const LEGEND: ReservationStatus[] = ["payee", "confirmee", "nouvelle", "realisee", "absente"];

export default async function PlanningPage({ searchParams }: { searchParams: Promise<{ semaine?: string }> }) {
  const { semaine } = await searchParams;
  const today = dayKey(new Date());
  const start = mondayOf(semaine && /^\d{4}-\d{2}-\d{2}$/.test(semaine) ? semaine : today);
  const days = Array.from({ length: 7 }, (_, i) => dayKey(new Date(parse(start).getTime() + i * DAY_MS)));
  const end = days[6]!;
  const prev = dayKey(new Date(parse(start).getTime() - 7 * DAY_MS));
  const next = dayKey(new Date(parse(start).getTime() + 7 * DAY_MS));
  const slots = generateDailySlots();
  const nowTime = new Date().toISOString().slice(11, 16);

  const db = getServiceClient();
  let rows: ReservationRow[] = [];
  if (db) {
    await releaseExpiredHolds();
    const { data } = await db.from("reservations").select("*").gte("live_date", start).lte("live_date", end).in("status", SHOWN);
    rows = (data ?? []) as ReservationRow[];
  }
  const bySlot = new Map(rows.map((r) => [`${r.live_date} ${r.slot_start}`, r]));

  const isOpen = (d: string) => isDateOpen(d) && d >= scheduleConfig.openingDate;
  const openSlots = days.filter(isOpen).length * slots.length;
  const booked = rows.filter((r) => r.status !== "nouvelle");
  const revenue = booked.filter((r) => r.status !== "confirmee").reduce((t, r) => t + r.package_price, 0);

  const fmt = (k: string, opts: Intl.DateTimeFormatOptions) => parse(k).toLocaleDateString("fr-FR", { ...opts, timeZone: "UTC" });
  const range = `${fmt(start, { day: "numeric", month: "long" })} – ${fmt(end, { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <>
      <PageTitle eyebrow={`Semaine du ${range}`} title="Planning">
        <div className="flex items-center gap-1 rounded-full border border-border p-1 text-sm">
          <Link href={`?semaine=${prev}`} aria-label="Semaine précédente" className="rounded-full p-1.5 hover:bg-muted">
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <Link href="/admin/planning" className={cn("rounded-full px-3 py-1", start === mondayOf(today) && "bg-foreground text-background")}>
            Cette semaine
          </Link>
          <Link href={`?semaine=${next}`} aria-label="Semaine suivante" className="rounded-full p-1.5 hover:bg-muted">
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </PageTitle>

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span>
          <strong className="tabular-nums">{booked.length}</strong> live{booked.length > 1 ? "s" : ""}
          {openSlots ? (
            <span className="text-muted-foreground">
              {" "}sur {openSlots} créneaux ({Math.round((booked.length / openSlots) * 100)} %)
            </span>
          ) : (
            <span className="text-muted-foreground"> · studio fermé cette semaine</span>
          )}
        </span>
        <span>
          <strong className="tabular-nums">{formatPrice(revenue)}</strong> <span className="text-muted-foreground">payés cette semaine</span>
        </span>
        <span className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:ml-auto">
          {LEGEND.map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span aria-hidden className={cn("size-2.5 rounded-full ring-1 ring-inset", toneClasses[reservationStatusMeta[s].tone])} />
              {reservationStatusMeta[s].label}
            </span>
          ))}
        </span>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="w-full min-w-[60rem] table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-28 bg-card p-3 text-left font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                Jour
              </th>
              {slots.map((s) => (
                <th key={s.id} scope="col" className="p-3 text-left font-mono text-xs font-semibold text-muted-foreground">
                  {formatTimeFr(s.start)}
                  <span className="font-normal"> – {formatTimeFr(s.end)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const open = isOpen(d);
              const isToday = d === today;
              return (
                <tr key={d} className={cn("border-t border-border", isToday && "bg-ocd-orange/5")}>
                  <th scope="row" className={cn("sticky left-0 z-10 bg-card p-3 text-left align-top", isToday && "shadow-[inset_3px_0_0_var(--color-ocd-orange)]")}>
                    <span className="block font-semibold capitalize">{fmt(d, { weekday: "long" })}</span>
                    <span className="block text-xs text-muted-foreground">
                      {fmt(d, { day: "numeric", month: "short" })}
                      {isToday && <span className="ml-1 font-semibold text-ocd-orange-dark dark:text-ocd-orange">· aujourd&apos;hui</span>}
                    </span>
                  </th>
                  {slots.map((s) => {
                    const r = bySlot.get(`${d} ${s.start}`);
                    const past = d < today || (d === today && s.end <= nowTime);
                    if (r) {
                      const meta = reservationStatusMeta[r.status];
                      const Icon = r.live_type === "distance" ? Wifi : MapPin;
                      return (
                        <td key={s.id} className="p-1.5 align-top">
                          <Link
                            href={`/admin/reservations/${r.id}`}
                            title={`${r.business_name} · ${r.full_name} · ${meta.label}`}
                            className={cn(
                              "block h-full min-h-20 rounded-xl p-2.5 ring-1 ring-inset transition hover:-translate-y-0.5 hover:shadow-md",
                              toneClasses[meta.tone],
                              r.status === "nouvelle" && "border border-dashed border-current bg-transparent ring-0",
                            )}
                          >
                            <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase">
                              <Icon className="size-3" aria-hidden />
                              {r.status === "nouvelle" ? "Paiement en cours" : meta.label}
                            </span>
                            <span className="mt-1 block truncate font-semibold text-foreground">{r.business_name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {r.full_name} · {r.package_name}
                            </span>
                          </Link>
                        </td>
                      );
                    }
                    return (
                      <td key={s.id} className="p-1.5 align-top">
                        <span
                          className={cn(
                            "flex min-h-20 items-center justify-center rounded-xl text-xs",
                            !open ? "bg-muted/40 text-muted-foreground/50" : past ? "text-muted-foreground/40" : "border border-dashed border-border text-muted-foreground",
                          )}
                        >
                          {!open ? "Fermé" : past ? "—" : "Libre"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Heures de Lomé (GMT). « Paiement en cours » : créneau bloqué 20 min le temps que le client paie.</p>
    </>
  );
}
