import type { Metadata } from "next";
import Link from "next/link";
import { ListFilters } from "@/components/admin/forms";
import { RecruitmentToggle } from "@/components/admin/recruitment-toggle";
import { EmptyState, formatDateTime, PageTitle, Pagination, StatusBadge } from "@/components/admin/ui";
import { parseCandidatureFilters } from "@/lib/admin/filters";
import { listCandidatures, PAGE_SIZE } from "@/lib/db/admin-queries";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Candidatures" };

type Search = Record<string, string | undefined>;

export default async function CandidaturesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const filters = parseCandidatureFilters(sp);
  const [{ rows, count }, settings] = await Promise.all([listCandidatures(filters), getSettings()]);
  const qs = (patch: Search) =>
    `?${new URLSearchParams(Object.entries({ ...sp, ...patch }).filter((e): e is [string, string] => Boolean(e[1]))).toString()}`;

  return (
    <>
      <PageTitle eyebrow={`${count} au total`} title="Candidatures animatrices" />
      <div className="mb-6">
        <RecruitmentToggle open={settings.recrutementOuvert} />
      </div>
      <ListFilters kind="candidature" />

      {rows.length === 0 ? (
        <EmptyState title="Aucune candidature">
          {Object.values(sp).some(Boolean) ? "Aucun résultat avec ces filtres." : "Les candidatures envoyées depuis la page Recrutement apparaîtront ici."}
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/candidatures/${c.id}`}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgb(17_17_17/0.35)]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-ocd-orange/15 font-semibold text-ocd-orange-dark dark:text-ocd-orange">
                    {c.full_name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                  <StatusBadge status={c.status} kind="candidature" />
                </span>
                <span className="mt-4 text-lg font-semibold group-hover:underline">{c.full_name}</span>
                <span className="text-sm text-muted-foreground">
                  {c.age ? `${c.age} ans · ` : ""}
                  {c.location}
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {c.languages.slice(0, 4).map((l) => (
                    <span key={l} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                      {l}
                    </span>
                  ))}
                  {c.video_url && <span className="rounded-full bg-ocd-black px-2.5 py-0.5 text-xs text-white">Vidéo</span>}
                </span>
                <span className="mt-auto pt-4 font-mono text-[11px] text-muted-foreground">
                  {c.reference} · {formatDateTime(c.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={filters.page ?? 1} total={count} pageSize={PAGE_SIZE} makeHref={(p) => qs({ page: String(p) })} />
    </>
  );
}
