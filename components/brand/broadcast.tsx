import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Coins de viseur de caméra posés autour d'un bloc. */
export function Viewfinder({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const c = tone === "dark" ? "border-ocd-black/35 dark:border-white/35" : "border-white/50";
  const corner = cn("absolute size-5 sm:size-7", c);
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-3 sm:inset-5", className)}>
      <span className={cn(corner, "top-0 left-0 border-t-2 border-l-2")} />
      <span className={cn(corner, "top-0 right-0 border-t-2 border-r-2")} />
      <span className={cn(corner, "bottom-0 left-0 border-b-2 border-l-2")} />
      <span className={cn(corner, "right-0 bottom-0 border-r-2 border-b-2")} />
    </div>
  );
}

/** Indicateur « ● REC ». */
export function Rec({ className, label = "REC" }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase", className)}>
      <span aria-hidden className="size-2 animate-live rounded-full bg-ocd-live" />
      {label}
    </span>
  );
}

/** Étiquette de section façon bandeau télé : carré orange + texte mono. */
export function Chyron({ children, index, className }: { children: ReactNode; index?: string; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-3 font-mono text-[11px] tracking-[0.22em] text-muted-foreground uppercase", className)}>
      <span aria-hidden className="size-2 bg-ocd-orange" />
      {index && <span className="text-foreground">{index}</span>}
      {index && <span aria-hidden className="h-px w-6 bg-current opacity-40" />}
      <span>{children}</span>
    </p>
  );
}

/** Macaron rond au texte qui tourne, avec un cœur fixe au centre. */
export function SpinBadge({
  text,
  children,
  className,
}: {
  text: string;
  children?: ReactNode;
  className?: string;
}) {
  const id = `spin-${useId().replace(/:/g, "")}`;
  return (
    <span aria-hidden className={cn("relative inline-flex size-28 items-center justify-center rounded-full sm:size-32", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full animate-spin-slow">
        <defs>
          <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current font-mono text-[9.5px] font-medium tracking-[0.2em] uppercase">
          <textPath href={`#${id}`}>{text}</textPath>
        </text>
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

/** Bandeau défilant. */
export function Marquee({
  children,
  className,
  speed = "normal",
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  speed?: "normal" | "fast";
  reverse?: boolean;
}) {
  return (
    <div className={cn("flex overflow-hidden whitespace-nowrap select-none", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center",
          speed === "fast" ? "animate-marquee-fast" : "animate-marquee",
          reverse && "[animation-direction:reverse]",
        )}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
