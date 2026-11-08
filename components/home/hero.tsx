"use client";

import { useRef, type PointerEvent } from "react";
import { AfricaNetwork } from "@/components/brand/africa-network";
import { Rec, SpinBadge, Viewfinder } from "@/components/brand/broadcast";
import { PillLink } from "@/components/ui/pill-link";
import { Timecode } from "./countdown";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef(0);

  // Le halo doré suit le pointeur, comme un projecteur de studio.
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--spot-x", `${x}%`);
      el.style.setProperty("--spot-y", `${y}%`);
    });
  };

  return (
    <section
      ref={ref}
      onPointerMove={onPointerMove}
      className="relative -mt-[4.25rem] overflow-hidden px-3 pt-[4.25rem] sm:-mt-[4.75rem] sm:px-5 sm:pt-[4.75rem]"
      style={{ ["--spot-x" as string]: "72%", ["--spot-y" as string]: "40%" }}
    >
      {/* Projecteur */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-700"
        style={{
          background:
            "radial-gradient(38rem circle at var(--spot-x) var(--spot-y), rgb(255 217 160 / 0.75), transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="relative min-h-[calc(100svh-6rem)] px-4 pt-14 pb-8 sm:px-8 sm:pt-16 lg:min-h-0">
          <Viewfinder />

          {/* Interface caméra */}
          <div className="relative z-10 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            <Rec label="CAM 01 · Lomé" className="text-foreground" />
            <span className="hidden sm:inline">6.13°N · 1.22°E</span>
            <Timecode className="text-foreground" />
          </div>

          <div className="relative grid gap-6 pt-10 lg:grid-cols-12 lg:pt-16">
            <div className="relative z-10 lg:col-span-8">
              <h1 className="text-[clamp(3.1rem,11.5vw,6.6rem)] xl:text-[7rem] leading-[0.9] font-semibold tracking-[-0.05em]">
                <span className="reveal-line">
                  <span>Ton produit</span>
                </span>
                <span className="reveal-line">
                  <span style={{ animationDelay: "0.08s" }}>mérite d&apos;être</span>
                </span>
                <span className="reveal-line">
                  <span style={{ animationDelay: "0.16s" }}>
                    <span className="accent text-ocd-orange-dark dark:text-ocd-orange">vu.</span>
                  </span>
                </span>
              </h1>

              <p className="fade-up mt-8 max-w-md text-lg leading-relaxed text-muted-foreground sm:text-xl" style={{ animationDelay: "0.45s" }}>
                Passe en live avec OCD Live : au studio à Lomé, ou à distance depuis n&apos;importe où en Afrique et dans le monde.{" "}
                <span className="text-foreground">Lancement le 1er décembre.</span>
              </p>

              <div className="fade-up mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "0.6s" }}>
                <PillLink href="/reserver?type=presentiel">Live au studio · Lomé</PillLink>
                <PillLink href="/reserver?type=distance" variant="outline">
                  Live à distance
                </PillLink>
              </div>
            </div>

            <div className="fade-up relative mx-auto w-full max-w-[26rem] lg:absolute lg:top-6 lg:-right-4 lg:max-w-[30rem]" style={{ animationDelay: "0.3s" }}>
              <AfricaNetwork />
              <SpinBadge
                text="Lancement · 1er décembre 2026 · "
                className="absolute -bottom-2 left-0 text-foreground sm:left-4 lg:bottom-6 lg:-left-6"
              >
                <span className="flex size-12 animate-wiggle items-center justify-center rounded-full bg-ocd-orange font-mono text-[10px] font-bold tracking-wider text-ocd-black sm:size-14">
                  LIVE
                </span>
              </SpinBadge>
            </div>
          </div>

          <div className="relative z-10 mt-14 flex items-end justify-between font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase lg:mt-20">
            <span>Le marketing avant la vente</span>
            <a href="#manifeste" className="flex items-center gap-2 text-foreground hover:text-accent-text">
              Défiler <span aria-hidden className="inline-block animate-bounce">↓</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
