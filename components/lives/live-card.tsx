"use client";

import Image from "next/image";
import { Heart, MessageCircle, Play } from "lucide-react";
import { getCategory, liveCover } from "@/config/live-categories";
import type { PublicLive } from "@/lib/db/lives";
import { countrySlug, sinceLabel } from "@/lib/lives";
import { Flag } from "@/components/ui/flag";
import { cn } from "@/lib/utils";
import { ShareButton } from "./share-button";

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

/** Cœurs qui montent en continu, comme pendant un live TikTok (décoratif). */
const HEARTS = [
  { sway: 14, delay: 0, dur: 3.2, size: 26, color: "#FE2C55" },
  { sway: -10, delay: 0.45, dur: 3.6, size: 20, color: "#FE2C55" },
  { sway: 18, delay: 0.9, dur: 3.0, size: 22, color: "#FE2C55" },
  { sway: -16, delay: 1.35, dur: 3.8, size: 18, color: "#FE2C55" },
  { sway: 8, delay: 1.8, dur: 3.3, size: 24, color: "#FE2C55" },
  { sway: -12, delay: 2.25, dur: 3.5, size: 19, color: "#FE2C55" },
  { sway: 16, delay: 2.7, dur: 3.1, size: 21, color: "#FE2C55" },
  { sway: -8, delay: 3.15, dur: 3.7, size: 23, color: "#FE2C55" },
];

function FloatingHearts({ seed }: { seed: number }) {
  const offset = (seed % 9) * 0.37;
  return (
    <div aria-hidden className="pointer-events-none absolute right-4 bottom-[5.25rem] z-[2] h-0 w-7">
      {/* Animation */}
      <div className="motion-reduce:hidden">
        {HEARTS.map((h, i) => (
          <Heart
            key={i}
            className="absolute bottom-0 left-1/2 -ml-3 opacity-0 drop-shadow-[0_2px_6px_rgb(0_0_0/0.45)]"
            style={{
              width: h.size,
              height: h.size,
              color: h.color,
              fill: h.color,
              animation: `heart-float ${h.dur}s ease-out ${(h.delay + offset).toFixed(2)}s infinite`,
              ["--sway" as string]: `${h.sway}px`,
            }}
          />
        ))}
      </div>
      {/* Version fixe si l'appareil réduit les animations */}
      <div className="hidden motion-reduce:block">
        <Heart className="absolute -bottom-1 left-0 size-6 fill-[#FE2C55] text-[#FE2C55] drop-shadow-[0_2px_6px_rgb(0_0_0/0.45)]" />
        <Heart className="absolute bottom-8 left-3 size-4 fill-[#FE2C55] text-[#FE2C55] opacity-90 drop-shadow-[0_2px_6px_rgb(0_0_0/0.45)]" />
        <Heart className="absolute bottom-14 -left-1 size-5 fill-[#FE2C55] text-[#FE2C55] opacity-80 drop-shadow-[0_2px_6px_rgb(0_0_0/0.45)]" />
      </div>
    </div>
  );
}

/** Tuile verticale 9:16 (standard des lives TikTok) : toute la tuile ouvre le live. */
export function LiveCard({ live }: { live: PublicLive }) {
  const featured = live.kind === "ocd";
  const cat = getCategory(live.category);
  const seed = hash(live.businessName);
  const cover = liveCover(live.category, live.businessName);
  const wa = live.whatsapp ? `https://wa.me/${live.whatsapp}?text=${encodeURIComponent("Bonjour, je viens d'OCD Live. Je t'ai vu en live.")}` : null;
  const ghost = "relative z-[3] inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25";
  const meta = [featured ? "OCD Live" : cat?.label, live.city ?? live.countryName].filter(Boolean).join(" · ");

  return (
    <article className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-[#161412] text-white ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-28px_rgb(0_0_0/0.7)] dark:ring-white/10">
      {/* Image de fond */}
      <Image
        src={cover}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        className="object-cover transition duration-700 group-hover:scale-[1.04]"
      />
      <div aria-hidden className="absolute inset-0 bg-black/15" />

      {/* Lien plein cadre */}
      <a href={live.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-[1]" aria-label={`Regarder le live de ${live.businessName} sur TikTok`} />

      {/* Haut */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-center justify-between gap-2 bg-gradient-to-b from-black/55 to-transparent px-3 pt-3 pb-10">
        <span className="flex items-center gap-2 text-xs font-medium text-white/90">
          <span className="rounded-[4px] bg-[#FE2C55] px-1.5 py-[3px] text-[10px] leading-none font-bold tracking-wider text-white">LIVE</span>
          <span suppressHydrationWarning>{sinceLabel(live.startedAt).replace("depuis ", "")}</span>
        </span>
        {featured && <span className="text-[11px] font-semibold text-ocd-orange">À la une</span>}
      </div>

      <FloatingHearts seed={seed} />

      {/* Bas */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/90 via-black/55 to-transparent px-3 pt-24 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-[11px] font-semibold ring-2 ring-[#FE2C55]">
            {live.avatarUrl ? <Image src={live.avatarUrl} alt="" fill unoptimized sizes="32px" className="object-cover" /> : initialsOf(live.businessName) || "?"}
          </span>
          <p className="line-clamp-2 min-w-0 text-[15px] leading-snug font-semibold">{live.businessName}</p>
        </div>
        <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-white/70">
          <Flag code={live.country} className="h-2.5 rounded-[2px] shadow-none" />
          <span className="truncate">{meta}</span>
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="flex flex-1 items-center gap-1.5 text-sm font-medium" aria-hidden>
            <Play className="size-3.5 fill-current" /> Regarder
          </span>
          <span className={cn("pointer-events-auto flex items-center gap-1.5")}>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`Écrire à ${live.businessName} sur WhatsApp`} className={ghost}>
                <MessageCircle className="size-4" aria-hidden />
              </a>
            )}
            <ShareButton
              text={`${live.businessName} est en live maintenant sur TikTok.`}
              path={`/live/${countrySlug(live.country)}`}
              iconOnly
              className={cn(ghost, "border-0 [&_svg]:size-4")}
            />
          </span>
        </div>
      </div>
    </article>
  );
}
