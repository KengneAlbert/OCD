import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, formatDateTime, PageTitle, Pagination } from "@/components/admin/ui";
import { listActivity } from "@/lib/db/admin-queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Journal d'activité" };

const ACTION_LABEL: Record<string, { label: string; cls: string }> = {
  created: { label: "Création", cls: "bg-ocd-orange/15 text-ocd-orange-dark dark:text-ocd-orange" },
  status_changed: { label: "Statut", cls: "bg-sky-500/12 text-sky-700 dark:text-sky-300" },
  note_updated: { label: "Note", cls: "bg-foreground/8 text-muted-foreground" },
  email_sent: { label: "Email", cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
  email_failed: { label: "Échec email", cls: "bg-red-500/12 text-red-700 dark:text-red-300" },
  login: { label: "Connexion", cls: "bg-violet-500/12 text-violet-700 dark:text-violet-300" },
  export: { label: "Export", cls: "bg-foreground/8 text-muted-foreground" },
  payment_started: { label: "Paiement ouvert", cls: "bg-ocd-orange/15 text-ocd-orange-dark dark:text-ocd-orange" },
  payment_succeeded: { label: "Paiement reçu", cls: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" },
  payment_failed: { label: "Paiement échoué", cls: "bg-red-500/12 text-red-700 dark:text-red-300" },
  payment_anomaly: { label: "Anomalie", cls: "bg-red-600 text-white" },
};

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Number((await searchParams).page) || 1;
  const { rows, count } = await listActivity(page);

  return (
    <>
      <PageTitle eyebrow="Traçabilité" title="Journal d'activité" />
      {rows.length === 0 ? (
        <EmptyState title="Rien pour l'instant">Chaque réservation, changement de statut, note ou email apparaîtra ici.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {rows.map((a) => {
              const meta = ACTION_LABEL[a.action] ?? { label: a.action, cls: "bg-muted" };
              const href =
                a.entity_id && a.entity_type !== "system"
                  ? `/admin/${a.entity_type === "candidature" ? "candidatures" : "reservations"}/${a.entity_id}`
                  : null;
              return (
                <li key={a.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">
                  <span className={cn("w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:w-28 sm:text-center", meta.cls)}>{meta.label}</span>
                  <span className="min-w-0 flex-1 text-sm">
                    {href ? (
                      <Link href={href} className="hover:underline">
                        {a.message}
                      </Link>
                    ) : (
                      a.message
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {a.actor} · {formatDateTime(a.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <Pagination page={page} total={count} pageSize={50} makeHref={(p) => `?page=${p}`} />
    </>
  );
}
