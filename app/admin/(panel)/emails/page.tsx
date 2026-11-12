import type { Metadata } from "next";
import Link from "next/link";
import { Eye } from "lucide-react";
import { EmptyState, formatDateTime, PageTitle, Pagination, Panel } from "@/components/admin/ui";
import { listEmailLog } from "@/lib/db/admin-queries";
import { getBrevoEnv } from "@/lib/emails/send";
import { EMAIL_TEMPLATES, type EmailTemplateId } from "@/lib/emails/templates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Emails" };

export default async function EmailsPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const status = sp.status === "failed" || sp.status === "sent" ? sp.status : undefined;
  const { rows, count } = await listEmailLog(page, status);
  const brevo = getBrevoEnv();
  const label = (t: string) => EMAIL_TEMPLATES[t as EmailTemplateId]?.label ?? t;

  return (
    <>
      <PageTitle eyebrow="Brevo" title="Emails" />

      <div
        className={cn(
          "mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-3xl p-5 text-sm",
          brevo ? "bg-emerald-500/10" : "bg-ocd-cream dark:bg-white/5",
        )}
      >
        <span className="font-semibold">{brevo ? "Brevo est configuré" : "Brevo n'est pas configuré"}</span>
        <span className="text-muted-foreground">{brevo ? "Emails automatiques actifs (réservations, candidatures, lives)." : "Aucun email automatique n'est envoyé."}</span>
        {brevo && <span className="text-muted-foreground">Expéditeur : {brevo.senderEmail} · Équipe : {brevo.teamEmail}</span>}
      </div>

      <Panel title="Gabarits" className="mb-6">
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(EMAIL_TEMPLATES) as [EmailTemplateId, (typeof EMAIL_TEMPLATES)[EmailTemplateId]][]).map(([id, t]) => (
            <li key={id}>
              <Link href={`/admin/emails/apercu?t=${id}`} className="group flex h-full items-start gap-3 rounded-2xl border border-border p-4 transition hover:border-ocd-orange">
                <Eye className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-ocd-orange-dark" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t.audience} · {t.trigger}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title={`Envois (${count})`}
        action={
          <div className="flex rounded-full border border-border p-1 text-xs">
            {[
              { v: undefined, l: "Tous" },
              { v: "sent", l: "Envoyés" },
              { v: "failed", l: "Échecs" },
            ].map((o) => (
              <Link key={o.l} href={o.v ? `?status=${o.v}` : "?"} className={cn("rounded-full px-3 py-1", status === o.v && "bg-foreground text-background")}>
                {o.l}
              </Link>
            ))}
          </div>
        }
      >
        {rows.length === 0 ? (
          <EmptyState title="Aucun email">Les emails envoyés par le site apparaîtront ici.</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                  <th className="px-5 py-2 font-medium sm:px-6">Email</th>
                  <th className="px-3 py-2 font-medium">Destinataire</th>
                  <th className="px-3 py-2 font-medium">Lié à</th>
                  <th className="px-5 py-2 font-medium sm:px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3 sm:px-6">
                      <span className="flex items-center gap-2">
                        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", e.status === "sent" ? "bg-emerald-500" : "bg-red-500")} />
                        <span className="font-medium">{label(e.template)}</span>
                      </span>
                      <span className="block pl-4 text-xs text-muted-foreground">{e.subject}</span>
                      {e.error && <span className="block pl-4 text-xs text-red-600">{e.error}</span>}
                    </td>
                    <td className="px-3 py-3 text-xs">{e.to_email}</td>
                    <td className="px-3 py-3 text-xs">
                      {e.entity_id && e.entity_type !== "system" ? (
                        <Link href={`/admin/${e.entity_type === "candidature" ? "candidatures" : "reservations"}/${e.entity_id}`} className="underline underline-offset-2">
                          Voir la fiche
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground sm:px-6">{formatDateTime(e.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={count} pageSize={50} makeHref={(p) => `?page=${p}${status ? `&status=${status}` : ""}`} />
      </Panel>
    </>
  );
}
