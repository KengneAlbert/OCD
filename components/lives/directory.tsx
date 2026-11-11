import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Clock } from "lucide-react";
import { Flag } from "@/components/ui/flag";
import { categories, liveCover } from "@/config/live-categories";
import { livesConfig } from "@/config/lives";
import type { LivesNow, PublicLive } from "@/lib/db/lives";
import { countrySlug, nextWindowLabel } from "@/lib/lives";
import { cn, formatPrice } from "@/lib/utils";
import { LiveCard } from "./live-card";

export function LiveGrid({ lives }: { lives: PublicLive[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {lives.map((l) => (
        <LiveCard key={l.id} live={l} />
      ))}
    </div>
  );
}

/** Pastille « ● 5 en live ». */
export function LiveCount({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", n ? "text-[#d61f45] dark:text-[#ff6b8a]" : "text-muted-foreground", className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", n ? "animate-pulse bg-[#FE2C55]" : "bg-muted-foreground/40")} />
      {n ? `${n} en live` : "Aucun live"}
    </span>
  );
}

/** Pays en live : drapeau, nom, nombre de lives. */
export function CountryList({ countries }: { countries: LivesNow["countries"] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {countries.map((c) => (
        <li key={c.code}>
          <Link
            href={`/live/${c.slug}`}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 transition hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_16px_32px_-24px_rgb(17_17_17/0.45)]"
          >
            <Flag code={c.code} className="h-8 rounded-md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold">{c.name}</span>
              <LiveCount n={c.count} className="mt-0.5" />
            </span>
            <ChevronRight className="size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Catégories d'un pays : tuiles photo avec le nombre de lives. */
export function CategoryTiles({ country, counts }: { country: string; counts: Map<string, number> }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((c) => {
        const n = counts.get(c.slug) ?? 0;
        return (
          <li key={c.slug}>
            <Link href={`/live/${countrySlug(country)}/${c.slug}`} className="group relative flex aspect-[4/3] items-end overflow-hidden rounded-2xl bg-muted p-3.5 text-white">
              <Image
                src={liveCover(c.slug, c.slug)}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className={cn("object-cover transition duration-700 group-hover:scale-[1.05]", !n && "grayscale-[60%]")}
              />
              <span aria-hidden className={cn("absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent", !n && "bg-black/40")} />
              <span className="relative">
                <span className="block text-base leading-tight font-semibold">{c.label}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/85">
                  <span aria-hidden className={cn("size-1.5 rounded-full", n ? "animate-pulse bg-[#FE2C55]" : "bg-white/50")} />
                  {n ? `${n} en live` : "Aucun live"}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Personne en live : prochain créneau + action. */
export function EmptyLives({ now, backHref, backLabel }: { now: Date; backHref?: string; backLabel?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      <Clock className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <p className="mt-4 text-xl font-semibold">Personne en live pour l&apos;instant.</p>
      <p className="mt-1 text-muted-foreground">Prochain créneau {nextWindowLabel(now)}.</p>
      {backHref && (
        <Link href={backHref} className="mt-6 inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 font-semibold transition hover:bg-muted">
          {backLabel} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Bloc abonnement vendeur. */
export function SubscribeCta() {
  const perDay = Math.round(livesConfig.subscriptionPrice / livesConfig.subscriptionDays);
  return (
    <div className="flex flex-col items-start gap-5 rounded-3xl bg-ocd-black p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-9 dark:bg-white/5">
      <div>
        <p className="text-2xl font-semibold tracking-tight">Tu vends en live sur TikTok ?</p>
        <p className="mt-1.5 text-white/65">
          Sois vu dans ton pays pour {formatPrice(livesConfig.subscriptionPrice)} par mois, soit {perDay} F par jour.
        </p>
      </div>
      <Link
        href="/moi"
        className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 font-semibold text-ocd-black transition hover:bg-ocd-orange sm:w-auto"
      >
        Rejoindre l&apos;annuaire <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
