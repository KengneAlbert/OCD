import { cn } from "@/lib/utils";
import { AfricaGlow } from "./africa-glow";
import { Logo } from "./logo";
import { LiveBadge } from "./live-badge";

/**
 * Le mur du studio : carte d'Afrique lumineuse, logo au centre, sol brillant
 * avec reflet. Signature visuelle du hero et de la page Studio.
 */
export function StudioWall({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <div className={cn("relative isolate", className)}>
      {/* Mur */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-b from-white to-ocd-cream px-6 pt-8 pb-14 glow-strong dark:from-[#1b1a19] dark:to-[#121110]">
        <div aria-hidden className="absolute inset-x-10 top-6 h-2/3 rounded-full bg-ocd-glow/40 blur-3xl dark:bg-ocd-orange/20" />
        <LiveBadge className="absolute top-4 left-4 z-10" />
        <div className="relative mx-auto max-w-[340px]">
          <AfricaGlow />
          <div className="absolute inset-0 flex items-center justify-center pb-6">
            <Logo href={null} size="lg" priority={priority} className="drop-shadow-[0_6px_14px_rgb(255_217_160/0.9)]" />
          </div>
        </div>
        {/* Bureau */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-12">
          <div className="mx-auto h-full w-2/3 rounded-t-2xl bg-gradient-to-b from-[#a8a29b] to-[#8a8580] shadow-[inset_0_6px_0_#b8865a] dark:from-[#4a4642] dark:to-[#363330]" />
        </div>
      </div>
      {/* Sol brillant + reflet */}
      <div aria-hidden className="mx-6 h-10 rounded-b-[2rem] studio-floor opacity-80 dark:opacity-20" />
    </div>
  );
}
