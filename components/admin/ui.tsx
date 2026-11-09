import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  candidatureStatusMeta,
  reservationStatusMeta,
  toneClasses,
  type CandidatureStatus,
  type ReservationStatus,
} from "@/lib/admin/status";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, kind = "reservation" }: { status: string; kind?: "reservation" | "candidature" }) {
  const meta =
    kind === "reservation"
      ? reservationStatusMeta[status as ReservationStatus]
      : candidatureStatusMeta[status as CandidatureStatus];
  if (!meta) return <span>{status}</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset", toneClasses[meta.tone])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export function PageTitle({ title, eyebrow, children }: { title: ReactNode; eyebrow?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-border bg-card", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          {title && <h2 className="font-semibold">{title}</h2>}
          {action}
        </header>
      )}
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, accent = false, href }: { label: string; value: ReactNode; hint?: ReactNode; accent?: boolean; href?: string }) {
  const body = (
    <>
      <p className={cn("font-mono text-[10px] tracking-[0.18em] uppercase", accent ? "text-ocd-black/70" : "text-muted-foreground")}>{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className={cn("mt-1 text-sm", accent ? "text-ocd-black/70" : "text-muted-foreground")}>{hint}</p>}
    </>
  );
  const cls = cn(
    "block rounded-3xl p-5 transition",
    accent ? "bg-ocd-orange text-ocd-black" : "border border-border bg-card",
    href && "hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgb(17_17_17/0.35)]",
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border px-6 py-14 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function KeyValue({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-border">
      {items
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="text-sm font-medium break-words whitespace-pre-line">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

export function Pagination({ page, total, pageSize, makeHref }: { page: number; total: number; pageSize: number; makeHref: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const btn = "inline-flex size-10 items-center justify-center rounded-full border border-border transition hover:bg-muted";
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Page {page} sur {pages} · {total} résultat{total > 1 ? "s" : ""}
      </span>
      <span className="flex gap-2">
        {page > 1 ? (
          <Link href={makeHref(page - 1)} className={btn} aria-label="Page précédente">
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className={cn(btn, "opacity-40")} aria-hidden>
            <ChevronLeft className="size-4" />
          </span>
        )}
        {page < pages ? (
          <Link href={makeHref(page + 1)} className={btn} aria-label="Page suivante">
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : (
          <span className={cn(btn, "opacity-40")} aria-hidden>
            <ChevronRight className="size-4" />
          </span>
        )}
      </span>
    </nav>
  );
}

const ACTION_DOT: Record<string, string> = {
  created: "bg-ocd-orange",
  status_changed: "bg-sky-500",
  note_updated: "bg-foreground/40",
  email_sent: "bg-emerald-500",
  email_failed: "bg-red-500",
  login: "bg-violet-500",
  payment_started: "bg-ocd-glow",
  payment_succeeded: "bg-emerald-600",
  payment_failed: "bg-red-400",
  payment_anomaly: "bg-red-600",
};

export function Timeline({ items }: { items: { id: number | string; action: string; message: string; actor: string; created_at: string }[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">Aucune activité pour l&apos;instant.</p>;
  return (
    <ol className="relative space-y-5 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-border">
      {items.map((it) => (
        <li key={it.id} className="relative pl-7">
          <span aria-hidden className={cn("absolute top-1.5 left-0 size-[11px] rounded-full ring-4 ring-card", ACTION_DOT[it.action] ?? "bg-foreground/30")} />
          <p className="text-sm">{it.message}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDateTime(it.created_at)} · {it.actor}
          </p>
        </li>
      ))}
    </ol>
  );
}

const dtf = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lome" });
const df = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export const formatDateTime = (iso: string) => dtf.format(new Date(iso));
/** "2026-12-03" → "jeu. 3 déc." */
export const formatShortDate = (isoDate: string) => df.format(new Date(`${isoDate}T00:00:00Z`));
