import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AFRICA_PATH, MADAGASCAR_PATH } from "@/components/brand/africa-glow";
import { LiveCountPill } from "./live-count-pill";

/** Accueil : une phrase, deux actions, un lien. */
export function Hero() {
  return (
    <section className="relative -mt-[4.25rem] overflow-hidden px-4 pt-[4.25rem] sm:-mt-[4.75rem] sm:pt-[4.75rem]">
      {/* Silhouette de l'Afrique, à peine visible */}
      <svg
        aria-hidden
        viewBox="-8 -10 400 416"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[110%] max-h-[52rem] -translate-x-1/2 -translate-y-1/2 text-foreground opacity-[0.035]"
      >
        <path d={AFRICA_PATH} fill="currentColor" />
        <path d={MADAGASCAR_PATH} fill="currentColor" />
      </svg>

      <div className="relative mx-auto flex min-h-[calc(88svh-4.25rem)] max-w-3xl flex-col items-center justify-center py-20 text-center">
        <div className="fade-up">
          <LiveCountPill />
        </div>

        <h1 className="mt-8 text-[clamp(2.75rem,8.5vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.04em] text-balance">
          <span className="reveal-line">
            <span>Ton produit mérite</span>
          </span>
          <span className="reveal-line">
            <span style={{ animationDelay: "0.08s" }}>
              d&apos;être <span className="accent text-ocd-orange-dark dark:text-ocd-orange">vu.</span>
            </span>
          </span>
        </h1>

        <p className="fade-up mt-6 text-lg text-muted-foreground sm:text-xl" style={{ animationDelay: "0.25s" }}>
          Vends en live. On s&apos;occupe du reste.
        </p>

        <div className="fade-up mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center" style={{ animationDelay: "0.4s" }}>
          <Link
            href="/reserver"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-foreground px-8 text-base font-semibold text-background transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ocd-orange-dark"
          >
            Réserver le studio
          </Link>
          <Link
            href="/live"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-border px-8 text-base font-semibold transition hover:border-foreground/40 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ocd-orange-dark"
          >
            Trouver un live
          </Link>
        </div>

        <Link
          href="/je-suis-en-live"
          className="fade-up group mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          style={{ animationDelay: "0.5s" }}
        >
          Tu vends en live ? Fais-toi voir
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
