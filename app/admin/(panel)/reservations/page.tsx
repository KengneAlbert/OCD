import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { ListFilters } from "@/components/admin/forms";
import { EmptyState, formatDateTime, formatShortDate, PageTitle, Pagination, StatusBadge } from "@/components/admin/ui";
import { parseReservationFilters } from "@/lib/admin/filters";
import { listReservations, PAGE_SIZE } from "@/lib/db/admin-queries";
import { formatSlotFr } from "@/lib/schedule";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Réservations" };

type Search = Record<string, string | undefined>;

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const filters = parseReservationFilters(sp);
  const { rows, count } = await listReservations(filters);

  const qs = (patch: Search) => {
    const p = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter((e): e is [string, string] => Boolean(e[1])));
    return `?${p.toString()}`;
  };
  const exportQs = new URLSearchParams(
    Object.entries({ status: filters.status, type: filters.type, from: filters.from, to: filters.to }).filter((e): e is [string, string] => Boolean(e[1])),
  );

  return (
    <>
      <PageTitle eyebrow={`${count} au total`} title="Réservations">
        <div className="flex rounded-full border border-border p-1 text-sm">
          <Link href={qs({ sort: undefined, page: undefined })} className={`rounded-full px-4 py-1.5 ${filters.sort !== "live" ? "bg-foreground text-background" : ""}`}>
            Récentes
          </Link>
          <Link href={qs({ sort: "live", page: undefined })} className={`rounded-full px-4 py-1.5 ${filters.sort === "live" ? "bg-foreground text-background" : ""}`}>
            Par date de live
          </Link>
        </div>
        <a
          href={`/admin/export?${exportQs.toString()}`}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          <Download className="size-4" aria-hidden /> Export CSV
        </a>
      </PageTitle>

      <ListFilters kind="reservation" showType showDates />

      {rows.length === 0 ? (
        <EmptyState title="Aucune réservation">
          {Object.values(sp).some(Boolean) ? "Aucun résultat avec ces filtres." : "Les réservations faites sur le site apparaîtront ici."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                  <th className="px-5 py-3 font-medium">Live</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Package</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium">Reçue le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="group relative transition hover:bg-muted/50">
                    <td className="px-5 py-4">
                      <Link href={`/admin/reservations/${r.id}`} className="after:absolute after:inset-0">
                        <span className="block font-semibold capitalize">{formatShortDate(r.live_date)}</span>
                        <span className="block font-mono text-xs text-muted-foreground">{formatSlotFr(r.slot_start, r.slot_end)}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block font-medium group-hover:underline">{r.business_name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {r.full_name} · <span className="font-mono">{r.reference}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="block">{r.package_name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatPrice(r.package_price)} · {r.live_type === "presentiel" ? "Studio" : `Distance${r.city ? ` · ${r.city}` : ""}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{formatDateTime(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={filters.page ?? 1} total={count} pageSize={PAGE_SIZE} makeHref={(p) => qs({ page: String(p) })} />
    </>
  );
}
