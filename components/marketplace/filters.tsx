"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { categories } from "@/config/live-categories";
import { cn } from "@/lib/utils";

/** Recherche, pays, type et catégorie : tout passe par l'adresse (partageable, indexable). */
export function MarketplaceFilters({ countries }: { countries: { code: string; name: string; count: number }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    start(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  const pays = params.get("pays");
  const cat = params.get("categorie");
  const type = params.get("type");
  const anyFilter = Boolean(pays || cat || type || params.get("q"));

  const tab = (active: boolean) =>
    cn("h-9 rounded-full px-4 text-sm font-medium transition", active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground");
  const chip = (active: boolean) =>
    cn(
      "h-9 shrink-0 rounded-full border px-3.5 text-sm transition",
      active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row">
        <form
          role="search"
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: q.trim() || null });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un produit ou une prestation"
            aria-label="Rechercher"
            className="h-12 w-full rounded-full border border-border bg-card pr-4 pl-11 text-base transition focus:border-foreground/40 focus:outline-none"
          />
        </form>
        <div className="relative md:w-56">
          <select
            value={pays ?? ""}
            onChange={(e) => go({ pays: e.target.value || null })}
            aria-label="Pays"
            className="h-12 w-full appearance-none rounded-full border border-border bg-card pr-10 pl-4 text-base transition focus:border-foreground/40 focus:outline-none"
          >
            <option value="">Tous les pays</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="inline-flex w-fit shrink-0 rounded-full border border-border bg-card p-1" role="group" aria-label="Type">
          <button type="button" className={tab(!type)} onClick={() => go({ type: null })} aria-pressed={!type}>
            Tout
          </button>
          <button type="button" className={tab(type === "produit")} onClick={() => go({ type: "produit" })} aria-pressed={type === "produit"}>
            Produits
          </button>
          <button type="button" className={tab(type === "service")} onClick={() => go({ type: "service" })} aria-pressed={type === "service"}>
            Prestations
          </button>
        </div>

        <div className="no-scrollbar -mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 lg:pt-0.5" role="group" aria-label="Catégories">
          {categories.map((c) => (
            <button key={c.slug} type="button" className={chip(cat === c.slug)} onClick={() => go({ categorie: cat === c.slug ? null : c.slug })} aria-pressed={cat === c.slug}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 empty:hidden lg:ml-auto lg:pt-2.5">
          {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Chargement" />}
          {anyFilter && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                start(() => router.push(pathname, { scroll: false }));
              }}
              className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden /> Effacer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
