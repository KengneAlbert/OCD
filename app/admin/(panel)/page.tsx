import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EmptyState, formatDateTime, formatShortDate, PageTitle, Panel, StatCard, StatusBadge } from "@/components/admin/ui";
import { MANUAL_RESERVATION_STATUSES, reservationStatusMeta, toneClasses } from "@/lib/admin/status";
import { getDashboard } from "@/lib/db/admin-queries";
import { formatSlotFr } from "@/lib/schedule";
import { cn, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Tableau de bord" };

const todayInLome = () => new Date().toISOString().slice(0, 10); // Lomé = GMT

export default async function DashboardPage() {
  const data = await getDashboard(todayInLome());
  if (!data) return <EmptyState title="Supabase non configuré">Les données apparaîtront ici une fois la base connectée.</EmptyState>;

  const max = Math.max(1, ...data.last14Days.map((d) => d.count));
  const active = data.byStatus.confirmee + data.byStatus.payee;

  return (
    <>
      <PageTitle eyebrow="Vue d'ensemble" title={<>Bonjour <span className="accent font-normal text-ocd-orange-dark dark:text-ocd-orange">l&apos;équipe.</span></>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard accent label="Payées" value={data.byStatus.payee} hint="réservations à préparer" href="/admin/reservations?status=payee" />
        <StatCard label="Lives à venir" value={active} hint="payés et confirmés" href="/admin/reservations?sort=live" />
        <StatCard label="Encaissé" value={formatPrice(data.revenuePaid)} hint={`+ ${formatPrice(data.revenueConfirmed)} confirmés`} />
        <StatCard
          label="Candidatures"
          value={data.newCandidatures}
          hint={data.emailsFailed7d ? `${data.emailsFailed7d} email(s) en échec sur 7 j` : "nouvelles à lire"}
          href={data.emailsFailed7d ? "/admin/emails?status=failed" : "/admin/candidatures?status=nouvelle"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel
          className="lg:col-span-3"
          title="Prochains lives"
          action={
            <Link href="/admin/reservations?sort=live" className="text-sm text-muted-foreground hover:text-foreground">
              Tout voir
            </Link>
          }
        >
          {data.upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun live programmé pour l&apos;instant.</p>
          ) : (
            <ul className="-my-3 divide-y divide-border">
              {data.upcoming.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/reservations/${r.id}`} className="group flex items-center gap-4 py-3">
                    <span className="w-24 shrink-0">
                      <span className="block text-sm font-semibold capitalize">{formatShortDate(r.live_date)}</span>
                      <span className="block font-mono text-xs text-muted-foreground">{formatSlotFr(r.slot_start, r.slot_end)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium group-hover:underline">{r.business_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.full_name} · {r.live_type === "presentiel" ? "Studio" : "À distance"} · {r.package_name}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="lg:col-span-2" title="Réservations · 14 derniers jours">
          <div className="flex h-36 items-end gap-1.5" role="img" aria-label="Nombre de réservations reçues par jour sur les 14 derniers jours">
            {data.last14Days.map((d) => (
              <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-[10px] font-semibold opacity-0 transition group-hover:opacity-100">{d.count}</span>
                <span
                  className={cn("w-full rounded-t-md transition", d.count ? "bg-ocd-orange group-hover:bg-ocd-orange-dark" : "bg-border")}
                  style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>{formatShortDate(data.last14Days[0]!.date)}</span>
            <span>Aujourd&apos;hui</span>
          </div>

          <ul className="mt-6 space-y-2">
            {MANUAL_RESERVATION_STATUSES.map((s) => (
              <li key={s}>
                <Link href={`/admin/reservations?status=${s}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-muted">
                  <span aria-hidden className={cn("size-2.5 rounded-full ring-1 ring-inset", toneClasses[reservationStatusMeta[s].tone])} />
                  <span className="flex-1">{reservationStatusMeta[s].label}</span>
                  <span className="font-semibold tabular-nums">{data.byStatus[s]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-6" title="Dernières demandes reçues">
        {data.latest.length === 0 ? (
          <p className="text-sm text-muted-foreground">Les réservations du site apparaîtront ici.</p>
        ) : (
          <ul className="-my-3 divide-y divide-border">
            {data.latest.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/reservations/${r.id}`} className="group flex items-center gap-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{r.reference}</span>
                  <span className="min-w-0 flex-1 truncate font-medium group-hover:underline">{r.business_name}</span>
                  <span className="hidden text-xs text-muted-foreground sm:block">{formatDateTime(r.created_at)}</span>
                  <StatusBadge status={r.status} />
                  <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
