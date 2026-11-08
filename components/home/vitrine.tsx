"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart } from "lucide-react";
import { Chyron } from "@/components/brand/broadcast";
import { showcase, type ShowcaseItem } from "@/config/content";
import { cn, formatNumber } from "@/lib/utils";

const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

/** Cœurs qui montent au survol, comme les réactions d'un live. */
function Hearts() {
  return (
    <span aria-hidden className="pointer-events-none absolute right-5 bottom-24 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      {[0, 1, 2, 3].map((i) => (
        <Heart
          key={i}
          className="absolute size-5 animate-heart fill-ocd-orange text-ocd-orange"
          style={{ animationDelay: `${i * 0.55}s`, ["--heart-x" as string]: `${(i % 2 ? -1 : 1) * (8 + i * 6)}px` }}
        />
      ))}
    </span>
  );
}

function LiveScreen({ item, index }: { item: ShowcaseItem; index: number }) {
  const body = (
    <>
      <Image
        src={item.image}
        alt={item.alt}
        fill
        sizes="(min-width: 1024px) 22rem, 72vw"
        className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-110"
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/85" />

      {/* Interface du live */}
      <span className="absolute inset-x-4 top-4 flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] uppercase",
            item.demo ? "bg-ocd-orange text-ocd-black" : "bg-ocd-live text-white",
          )}
        >
          <span className="size-1.5 animate-live rounded-full bg-current" />
          {item.demo ? "Bientôt" : "Replay"}
        </span>
        {item.viewers !== undefined && (
          <span className="rounded-full bg-black/45 px-2.5 py-1 font-mono text-[10px] tracking-wider text-white backdrop-blur">
            {formatNumber(item.viewers)} vues
          </span>
        )}
      </span>

      <Hearts />

      <span className="absolute inset-x-5 bottom-5 text-white">
        <span className="font-mono text-[10px] tracking-[0.2em] text-white/70 uppercase">
          {item.category} · {item.date}
        </span>
        <span className="mt-1 flex items-end justify-between gap-3">
          <span className="text-2xl leading-tight font-semibold tracking-tight">{item.business}</span>
          {item.link && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-ocd-black transition-transform duration-500 group-hover:rotate-45">
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          )}
        </span>
      </span>
    </>
  );

  const frame = cn(
    "group relative block aspect-[3/4] w-[72vw] max-w-[22rem] shrink-0 snap-center overflow-hidden rounded-[2rem] bg-ocd-black shadow-[0_30px_60px_-30px_rgb(17_17_17/0.55)] transition-transform duration-700 ease-[var(--ease-out-expo)] hover:z-10 hover:rotate-0 hover:-translate-y-2 sm:w-[19rem]",
    tilts[index % tilts.length],
  );

  return item.link ? (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className={frame} aria-label={`Voir le replay : ${item.business}`}>
      {body}
    </a>
  ) : (
    <figure className={frame}>{body}</figure>
  );
}

export function Vitrine() {
  const track = useRef<HTMLDivElement>(null);
  // Dès qu'un vrai live est ajouté, les images d'illustration disparaissent.
  const real = showcase.filter((s) => !s.demo);
  const items = real.length > 0 ? real : showcase;
  const isDemo = real.length === 0;
  const credits = items
    .flatMap((s) => (s.credit ? [s.credit] : []))
    .filter((c, i, all) => all.findIndex((o) => o.author === c.author) === i);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 640), behavior: "smooth" });
  };

  return (
    <section aria-labelledby="vitrine-title" className="overflow-hidden py-20 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-5 sm:px-6">
        <div className="max-w-2xl">
          <Chyron index="06">La vitrine</Chyron>
          <h2 id="vitrine-title" className="mt-5 text-[clamp(2.6rem,7vw,5rem)] leading-[0.95] font-semibold tracking-[-0.04em]">
            Les OCD passés <span className="accent text-ocd-orange-dark dark:text-ocd-orange">en live.</span>
          </h2>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            {isDemo
              ? "Les premiers passent dès le 1er décembre. Le prochain écran, c'est peut-être le tien."
              : "Ils ont présenté leurs produits en direct avec OCD Live."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="flex size-12 items-center justify-center rounded-full border border-foreground/20 transition hover:bg-foreground hover:text-background"
            aria-label="Images précédentes"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="flex size-12 items-center justify-center rounded-full bg-ocd-orange text-ocd-black transition hover:bg-ocd-black hover:text-white"
            aria-label="Images suivantes"
          >
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div
        ref={track}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pt-6 pb-10 sm:gap-7 sm:px-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]"
      >
        {items.map((item, i) => (
          <LiveScreen key={`${item.business}-${i}`} item={item} index={i} />
        ))}

        {/* Dernier écran : la place du visiteur */}
        <Link
          href="/reserver"
          className="group relative flex aspect-[3/4] w-[72vw] max-w-[22rem] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-[2rem] bg-ocd-orange p-6 text-ocd-black rotate-1 transition-transform duration-700 ease-[var(--ease-out-expo)] hover:rotate-0 hover:-translate-y-2 sm:w-[19rem]"
        >
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ocd-black px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-white uppercase">
            <span aria-hidden className="size-1.5 animate-live rounded-full bg-ocd-live" />
            Ta place
          </span>
          <span>
            <span className="block text-[2.6rem] leading-[0.95] font-semibold tracking-tight">
              Ton business <span className="accent">ici.</span>
            </span>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-ocd-black py-2 pr-2 pl-4 text-sm font-semibold text-white">
              Réserver un créneau
              <span className="flex size-7 items-center justify-center rounded-full bg-white text-ocd-black transition-transform duration-500 group-hover:rotate-45">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </span>
          </span>
        </Link>
      </div>

      {isDemo && credits.length > 0 && (
        <p className="mx-auto max-w-6xl px-5 text-xs leading-relaxed text-muted-foreground sm:px-6">
          Images d&apos;illustration : marchés du Togo, ce ne sont pas des clients OCD Live. Photos Wikimedia Commons ·{" "}
          {credits.map((c, i) => (
            <span key={c.url}>
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                {c.author}
              </a>
              {i < credits.length - 1 ? ", " : ""}
            </span>
          ))}{" "}
          ({credits[0]?.license}).
        </p>
      )}
    </section>
  );
}
