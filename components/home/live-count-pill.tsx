"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { livesConfig } from "@/config/lives";

/** « ● 15 vendeurs en live maintenant » (lien vers l'annuaire). Avant le chargement ou sans live : date de lancement. */
export function LiveCountPill() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/lives", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { total?: number } | null) => setTotal(d?.total ?? 0))
        .catch(() => undefined);
    load();
    const id = window.setInterval(() => document.visibilityState === "visible" && load(), livesConfig.refreshSeconds * 1000);
    return () => window.clearInterval(id);
  }, []);

  const live = (total ?? 0) > 0;
  return (
    <Link
      href={live ? "/live" : "/reserver"}
      className="group inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-sm text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
    >
      <span aria-hidden className="size-1.5 rounded-full bg-[#FE2C55]" />
      <span aria-live="polite">{live ? `${total} vendeur${total! > 1 ? "s" : ""} en live maintenant` : "Lancement le 1er décembre"}</span>
      <ArrowRight className="size-3.5 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
    </Link>
  );
}
