import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatDateTime, formatShortDate, EmptyState, PageTitle, Panel, StatCard, StatusBadge } from "@/components/admin/ui";
import { getDashboard, type Breakdown } from "@/lib/db/dashboard";
import { formatSlotFr } from "@/lib/schedule";
import { cn, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

const todayInLome = () => new Date().toISOString().slice(0, 10); // Lomé = GMT
const pct = (rate: number | null) => (rate === null ? "—" : `${Math.round(rate * 100)} %`);
const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M` : n >= 1000 ? `${Math.round(n / 1000)} k` : String(n));

/** Évolution par rapport au mois précédent. */
function Trend({ now, before, onAccent = false }: { now: number; before: number; onAccent?: boolean }) {
  if (!before) return <span className={onAccent ? "text-ocd-black/70" : "text-muted-foreground"}>{now ? "premier mois" : "aucune donnée le mois dernier"}</span>;
  const delta = Math.round(((now - before) / before) * 100);
  const up = delta >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold", onAccent ? "text-ocd-black" : up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
      <Icon className="size-4" aria-hidden />
      {up ? "+" : ""}
      {delta} % <span className={cn("font-normal", onAccent ? "text-ocd-black/70" : "text-muted-foreground")}>vs mois dernier</span>
    </span>
  );
}

function Bars({ items, empty, money = true }: { items: Breakdown[]; empty: string; money?: boolean }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => (money ? i.revenue : i.count)));
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{i.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{money ? formatPrice(i.revenue) : i.count}</span>
              {money && ` · ${i.count}`}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-ocd-orange" style={{ width: `${Math.max(3, ((money ? i.revenue : i.count) / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function DashboardPage() {
  const data = await getDashboard(todayInLome());
  if (!data) return <EmptyState title="Supabase non configuré">Les données apparaîtront ici une fois la base connectée.</EmptyState>;

  const { month } = data;
  const maxDay = Math.max(1, ...data.revenue30Days.map((d) => d.amount));
  const total30 = data.revenue30Days.reduce((t, d) => t + d.amount, 0);

  return (
    <>
      <PageTitle
        eyebrow={`Vue d'ensemble · ${month.label}`}
        title={
          <>
            Bonjour <span className="accent font-normal text-ocd-orange-dark dark:text-ocd-orange">l&apos;équipe.</span>
          </>
        }
      />

      {data.emailsFailed7d > 0 && (
        <Link
          href="/admin/emails?status=failed"
          className="mb-6 flex items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-800 transition hover:bg-red-500/15 dark:text-red-200"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {data.emailsFailed7d} email(s) en échec sur les 7 derniers jours : à vérifier.
        </Link>
      )}

      {/* Argent */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard accent label="CA du mois" value={formatPrice(month.revenue)} hint={<Trend now={month.revenue} before={month.prevRevenue} onAccent />} />
        <StatCard label="Net après frais" value={formatPrice(month.net)} hint={`${formatPrice(month.fees)} de frais Swinmo`} />
        <StatCard label="Réservations payées" value={month.paid} hint={<Trend now={month.paid} before={month.prevPaid} />} href="/admin/reservations?status=payee" />
        <StatCard label="Panier moyen" value={formatPrice(data.averageBasket)} hint={`${formatPrice(data.allTime.revenue)} encaissés au total`} />
      </div>

      {/* Activité */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Conversion · 30 j"
          value={pct(data.conversion30d.rate)}
          hint={data.conversion30d.attempts ? `${data.conversion30d.paid} payées sur ${data.conversion30d.attempts} tentatives` : "aucune tentative"}
          href="/admin/reservations?status=expiree"
        />
        <StatCard
          label="Remplissage · 30 j"
          value={pct(data.occupancy30d.rate)}
          hint={
            <>
              {data.occupancy30d.booked} / {data.occupancy30d.capacity} créneaux
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-ocd-orange" style={{ width: `${Math.min(100, data.occupancy30d.rate * 100)}%` }} />
              </span>
            </>
          }
        />
        <StatCard label="Lives · 7 jours" value={data.next7Days} hint={`${data.byStatus.payee} réservation(s) payée(s) à préparer`} href="/admin/reservations?sort=live" />
        <StatCard
          label="Taux d'absence"
          value={pct(data.noShowRate)}
          hint={data.noShowRate === null ? "aucun live passé" : `${data.byStatus.absente} absent·e(s) · ${data.byStatus.annulee} annulation(s)`}
          href="/admin/reservations?status=absente"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title="Encaissements · 30 derniers jours" action={<span className="text-sm font-semibold tabular-nums">{formatPrice(total30)}</span>}>
          <div className="flex h-44 items-end gap-1" role="img" aria-label="Montant encaissé par jour sur les 30 derniers jours">
            {data.revenue30Days.map((d) => (
              <div key={d.date} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                <span className="pointer-events-none absolute -top-1 z-10 -translate-y-full rounded-md bg-ocd-black px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100">
                  {formatShortDate(d.date)} · {formatPrice(d.amount)}
                </span>
                <span
                  className={cn("w-full rounded-t-[3px] transition", d.amount ? "bg-ocd-orange group-hover:bg-ocd-orange-dark" : "bg-border")}
                  style={{ height: `${Math.max(3, (d.amount / maxDay) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>{formatShortDate(data.revenue30Days[0]!.date)}</span>
            <span>max {compact(maxDay)} FCFA / jour</span>
            <span>Aujourd&apos;hui</span>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
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
                  <Link href={`/admin/reservations/${r.id}`} className="group flex items-center gap-3 py-3">
                    <span className="w-20 shrink-0">
                      <span className="block text-sm font-semibold capitalize">{formatShortDate(r.live_date)}</span>
                      <span className="block font-mono text-xs text-muted-foreground">{formatSlotFr(r.slot_start, r.slot_end)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium group-hover:underline">{r.business_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.live_type === "presentiel" ? "Studio" : "À distance"} · {r.package_name}
                      </span>
                    </span>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Packages vendus">
          <Bars items={data.byPackage} empty="Aucune vente pour l'instant." />
        </Panel>
        <Panel title="Studio ou à distance">
          <Bars items={data.byType} empty="Aucune vente pour l'instant." />
        </Panel>
        <Panel title="Moyens de paiement">
          <Bars items={data.byOperator} empty="Aucun paiement en ligne pour l'instant." />
        </Panel>
        <Panel title="Pays des clients">
          <Bars items={data.byCountry} empty="Aucune vente pour l'instant." money={false} />
        </Panel>
        <Panel title="Métiers des clients" className="xl:col-span-2">
          <Bars items={data.byCategory} empty="Aucune vente pour l'instant." />
        </Panel>
      </div>

      <Panel className="mt-6" title="Dernières réservations">
        {data.latest.length === 0 ? (
          <p className="text-sm text-muted-foreground">Les réservations payées apparaîtront ici.</p>
        ) : (
          <ul className="-my-3 divide-y divide-border">
            {data.latest.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/reservations/${r.id}`} className="group flex items-center gap-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{r.reference}</span>
                  <span className="min-w-0 flex-1 truncate font-medium group-hover:underline">{r.business_name}</span>
                  <span className="hidden text-sm font-semibold tabular-nums sm:block">{formatPrice(r.package_price)}</span>
                  <span className="hidden text-xs text-muted-foreground md:block">{formatDateTime(r.updated_at)}</span>
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
