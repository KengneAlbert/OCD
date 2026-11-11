"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { livesConfig } from "@/config/lives";
import type { LivesNow as LivesNowData } from "@/lib/db/lives";
import { CountryList, LiveGrid } from "./directory";

/** Accueil : pays en live + quelques lives (à la une d'abord). Rafraîchi automatiquement. */
export function LivesNow({ limit = 10 }: { limit?: number }) {
  const [data, setData] = useState<LivesNowData | null>(null);

  const load = useCallback(() => {
    fetch("/api/lives", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: LivesNowData | null) => d && setData(d))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(() => document.visibilityState === "visible" && load(), livesConfig.refreshSeconds * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[9/16] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (data.total === 0) {
    return (
      <div className="rounded-[2rem] border-2 border-dashed border-border px-6 py-10 text-center">
        <p className="text-xl font-semibold">Personne en live pour l&apos;instant.</p>
        <Link href="/live" className="mt-4 inline-flex min-h-14 items-center gap-2 rounded-full bg-ocd-black px-6 text-lg font-semibold text-white dark:bg-white dark:text-ocd-black">
          🌍 Voir l&apos;annuaire <ArrowRight className="size-5" aria-hidden />
        </Link>
      </div>
    );
  }

  const shown = [...data.featured, ...data.lives].slice(0, limit);
  return (
    <div className="space-y-8">
      <CountryList countries={data.countries.slice(0, 6)} />
      <LiveGrid lives={shown} />
      <Link href="/live" className="inline-flex min-h-14 items-center gap-2 rounded-full bg-ocd-black px-6 text-lg font-semibold text-white dark:bg-white dark:text-ocd-black">
        🔍 Trouver un live ({data.total}) <ArrowRight className="size-5" aria-hidden />
      </Link>
    </div>
  );
}
