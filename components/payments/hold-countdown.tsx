"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minuteur du créneau bloqué pendant le paiement.
 * À zéro, la page est rechargée : le serveur affiche alors « délai dépassé ».
 */
export function HoldCountdown({ expiresAt, totalMinutes }: { expiresAt: string; totalMinutes: number }) {
  const router = useRouter();
  const end = new Date(expiresAt).getTime();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [end]);

  useEffect(() => {
    if (left === 0) {
      const id = window.setTimeout(() => router.refresh(), 1500);
      return () => window.clearTimeout(id);
    }
  }, [left, router]);

  // Avant l'hydratation : pas de chiffre (évite un écart serveur / navigateur).
  const seconds = left === null ? null : Math.ceil(left / 1000);
  const mm = seconds === null ? "--" : String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = seconds === null ? "--" : String(seconds % 60).padStart(2, "0");
  const ratio = left === null ? 1 : left / (totalMinutes * 60_000);
  const urgent = seconds !== null && seconds <= 5 * 60;
  const until = new Date(expiresAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lome" });

  return (
    <div
      className={cn(
        "mt-6 overflow-hidden rounded-2xl px-4 py-3 transition-colors",
        urgent ? "bg-red-500/10 text-red-900 dark:text-red-100" : "bg-ocd-orange/10",
      )}
    >
      <div className="flex items-center gap-3">
        <Clock className={cn("size-5 shrink-0", urgent ? "text-red-600" : "text-ocd-orange-dark", urgent && seconds! > 0 && "animate-pulse")} aria-hidden />
        <p className="flex-1 text-sm font-medium">
          {seconds === 0 ? (
            "Délai écoulé, le créneau va être libéré…"
          ) : (
            <>
              Créneau bloqué pour toi. Paie avant <strong>{until}</strong> (heure de Lomé) pour le garder.
            </>
          )}
        </p>
        <span
          role="timer"
          aria-label={seconds === null ? "Temps restant" : `${Math.floor(seconds / 60)} minutes ${seconds % 60} secondes restantes`}
          className="font-mono text-2xl font-semibold tabular-nums"
        >
          {mm}:{ss}
        </span>
      </div>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className={cn("h-full rounded-full transition-[width] duration-1000 ease-linear", urgent ? "bg-red-500" : "bg-ocd-orange")}
          style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}
