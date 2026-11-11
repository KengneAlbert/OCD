"use client";

import { useEffect, useState } from "react";
import { currentWindow, durationLabel, hourLabel, nextWindowStart } from "@/lib/lives";
import { cn } from "@/lib/utils";

const lomeHour = (d: Date) => hourLabel(d.toISOString().slice(11, 16));
const localHour = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "numeric", minute: "2-digit" }).replace(":", "h");
const atEnd = (now: Date, hhmm: string) => new Date(`${now.toISOString().slice(0, 10)}T${hhmm}:00Z`);

/** Heure qui avance toute seule (rafraîchie toutes les 30 s). Démarre sur l'heure du serveur. */
export function useNow(serverNow: string, everyMs = 30_000) {
  const [now, setNow] = useState(() => new Date(serverNow));
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
}

/**
 * État de la validation : « 🟢 Validation ouverte jusqu'à 11h00 » ou
 * « ⏳ Prochaine ouverture dans 2h14 ». Heure de Lomé, avec l'heure locale du visiteur si elle diffère.
 */
export function ValidationStatus({ serverNow, variant = "pill", className }: { serverNow: string; variant?: "pill" | "banner"; className?: string }) {
  const now = useNow(serverNow);
  const [localDiffers, setLocalDiffers] = useState(false);
  useEffect(() => setLocalDiffers(new Date().getTimezoneOffset() !== 0), []);

  const open = currentWindow(now);
  const target = open ? atEnd(now, open.end) : nextWindowStart(now);
  const local = localDiffers ? ` · ${localHour(target)} chez toi` : "";
  const text = open ? `Validation ouverte jusqu'à ${lomeHour(target)}` : `Prochaine ouverture dans ${durationLabel(target.getTime() - now.getTime())}`;
  const sub = open ? `Heure de Lomé${local}` : `À ${lomeHour(target)}, heure de Lomé${local}`;

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3",
        variant === "banner" ? "justify-center px-4 py-2.5 text-center" : "w-fit rounded-full px-4 py-2",
        open ? "bg-emerald-500/12 text-emerald-800 dark:text-emerald-200" : "bg-muted text-foreground",
        className,
      )}
    >
      <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", open ? "animate-pulse bg-emerald-500" : "bg-ocd-orange")} />
      <span className="text-base font-semibold" suppressHydrationWarning>
        {text}
      </span>
      <span className="hidden text-sm opacity-70 sm:inline" suppressHydrationWarning>
        {sub}
      </span>
    </div>
  );
}
