"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { livesConfig } from "@/config/lives";
import type { LivesNow, PublicLive } from "@/lib/db/lives";
import { LiveCard } from "./live-card";

/**
 * Carrousel de lives en cours (tuiles 9:16) qui défile tout seul de la gauche vers la droite, en boucle.
 * Pause au survol, au toucher et au focus clavier. Si l'appareil réduit les animations : simple rangée à faire glisser.
 * Ne s'affiche pas s'il n'y a aucun live.
 */
export function LivesStrip({ max = 12, className }: { max?: number; className?: string }) {
  const [lives, setLives] = useState<PublicLive[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const load = () =>
      fetch("/api/lives", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d: LivesNow | null) => {
          if (!d) return;
          setLives([...d.featured, ...d.lives].slice(0, max));
          setTotal(d.total);
        })
        .catch(() => undefined);
    load();
    const id = window.setInterval(() => document.visibilityState === "visible" && load(), livesConfig.refreshSeconds * 1000);
    return () => window.clearInterval(id);
  }, [max]);

  if (!lives?.length) return null;

  // Assez de tuiles pour remplir l'écran, puis la même série une 2e fois pour une boucle sans couture.
  const base = lives.length < 6 ? [...lives, ...lives, ...lives].slice(0, 6) : lives;
  const duration = base.length * 6; // ~6 s par tuile

  return (
    <div className={className}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden className="size-2 animate-pulse rounded-full bg-[#FE2C55]" />
          En ce moment sur OCD Live
        </p>
        <Link href="/live" className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          Voir les {total} lives
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <div
        className="group/carousel -mx-5 overflow-hidden sm:-mx-6 lg:mx-0 motion-reduce:no-scrollbar motion-reduce:overflow-x-auto"
        style={{ maskImage: "linear-gradient(to right, transparent, black 2%, black 98%, transparent)" }}
      >
        <ul
          aria-label="Lives en cours"
          className="flex w-max py-2 group-hover/carousel:[animation-play-state:paused] group-focus-within/carousel:[animation-play-state:paused] group-active/carousel:[animation-play-state:paused]"
          style={{ animation: `marquee ${duration}s linear infinite reverse` }}
        >
          {[...base, ...base].map((l, i) => (
            <li
              key={`${l.id}-${i}`}
              className={i >= base.length ? "mr-3 w-[44vw] shrink-0 sm:mr-4 sm:w-52 lg:w-56 motion-reduce:hidden" : "mr-3 w-[44vw] shrink-0 sm:mr-4 sm:w-52 lg:w-56"}
              aria-hidden={i >= base.length || undefined}
              inert={i >= base.length || undefined}
            >
              <LiveCard live={l} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
