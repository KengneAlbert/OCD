import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { EndLiveAdminButton, ReviewLiveButtons } from "@/components/admin/lives-forms";
import { LiveQueueWatcher } from "@/components/admin/live-queue-watcher";
import { formatDateTime, PageTitle, Panel } from "@/components/admin/ui";
import { Flag } from "@/components/ui/flag";
import { getCategory } from "@/config/live-categories";
import { getCountry } from "@/config/countries";
import { livesConfig } from "@/config/lives";
import { listLivesForAdmin, type LiveSubmissionRow } from "@/lib/db/lives";
import { currentWindow, hourLabel, isSubscriptionActive, nextWindowLabel, PLATFORMS, sinceLabel, windowsLabel } from "@/lib/lives";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Lives" };
export const dynamic = "force-dynamic";

const time = (iso: string) => hourLabel(new Date(iso).toISOString().slice(11, 16));
const statusLabel: Record<LiveSubmissionRow["status"], string> = { en_attente: "En attente", valide: "Validé", refuse: "Refusé", termine: "Terminé" };

function LiveLine({ l, now, children }: { l: LiveSubmissionRow; now: Date; children?: React.ReactNode }) {
  const s = l.subscriber;
  const active = isSubscriptionActive(s?.paid_until, now);
  const cat = getCategory(l.category);
  return (
    <li className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold">
          {s?.business_name ?? "?"}
          {s?.tiktok_handle && <span className="font-normal text-muted-foreground"> @{s.tiktok_handle}</span>}
        </p>
        <p className="mt-0.5 text-sm">
          <span className="font-semibold">{PLATFORMS[l.platform]?.label}</span> · {cat?.label} · <Flag code={l.country} className="mx-0.5 -mt-0.5 h-3 align-middle" />{" "}
          {getCountry(l.country)?.name ?? l.country}
          {s?.city && ` (${s.city})`}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Envoyé {sinceLabel(l.created_at, now).replace("depuis", "il y a")} · affiché jusqu&apos;à {time(l.ends_at)}
          {!active && <span className="ml-1 font-semibold text-red-600">· abonnement expiré</span>}
        </p>
      </div>
      <a
        href={l.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700"
      >
        Ouvrir le live <ExternalLink className="size-4" aria-hidden />
      </a>
      <div className="shrink-0">{children}</div>
    </li>
  );
}

export default async function AdminLivesPage() {
  const now = new Date();
  const { pending, online, recent } = await listLivesForAdmin(now);
  const open = currentWindow(now);

  return (
    <>
      <PageTitle eyebrow={`Validation ${windowsLabel()} (Lomé)`} title="Lives">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
              open ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground",
            )}
          >
            <span aria-hidden className={cn("size-2 rounded-full", open ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/50")} />
            {open ? `Ouverte jusqu'à ${hourLabel(open.end)}` : `Fermée · ${nextWindowLabel(now)}`}
          </span>
          <LiveQueueWatcher pending={pending.length} seconds={livesConfig.adminRefreshSeconds} />
        </div>
      </PageTitle>

      <Panel title={`À valider (${pending.length})`} className={cn(pending.length && "ring-2 ring-ocd-orange")}>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            File vide. Elle se met à jour toute seule toutes les {livesConfig.adminRefreshSeconds} s.
          </p>
        ) : (
          <ul className="-my-4 divide-y divide-border">
            {pending.map((l) => (
              <LiveLine key={l.id} l={l} now={now}>
                <ReviewLiveButtons id={l.id} />
              </LiveLine>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`En ligne sur le site (${online.length})`} className="mt-6">
        {online.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun live affiché.</p>
        ) : (
          <ul className="-my-4 divide-y divide-border">
            {online.map((l) => (
              <LiveLine key={l.id} l={l} now={now}>
                <EndLiveAdminButton id={l.id} />
              </LiveLine>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Historique récent" className="mt-6">
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Rien pour l&apos;instant.</p>
        ) : (
          <ul className="-my-3 divide-y divide-border text-sm">
            {recent.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-0 flex-1 truncate">
                  <strong>{l.subscriber?.business_name}</strong> · {PLATFORMS[l.platform]?.label} · {getCategory(l.category)?.label}
                  {l.reject_reason && <span className="text-muted-foreground"> · {l.reject_reason}</span>}
                </span>
                <span className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                  {statusLabel[l.status]}
                  {l.reviewed_by ? ` · ${l.reviewed_by.split("@")[0]}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
