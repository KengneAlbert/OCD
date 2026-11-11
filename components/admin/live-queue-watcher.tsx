"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "ocd-admin-son";

/** Petit « ding » généré (pas de fichier audio à charger). */
function ding() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    /* son indisponible */
  }
}

/**
 * File d'attente « en direct » : recharge la page toutes les `seconds` secondes,
 * joue un son et met le nombre dans l'onglet quand un nouveau live arrive.
 */
export function LiveQueueWatcher({ pending, seconds }: { pending: number; seconds: number }) {
  const router = useRouter();
  const previous = useRef(pending);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    try {
      setSound(window.localStorage.getItem(KEY) === "1");
    } catch {
      /* stockage indisponible */
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);

  useEffect(() => {
    if (pending > previous.current && sound) ding();
    previous.current = pending;
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = pending ? `(${pending}) ${base}` : base;
  }, [pending, sound]);

  const toggle = () => {
    const next = !sound;
    setSound(next);
    if (next) ding(); // le navigateur autorise le son après un clic
    try {
      window.localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* stockage indisponible */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={sound}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
        sound ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-border hover:bg-muted",
      )}
    >
      {sound ? <Bell className="size-4" aria-hidden /> : <BellOff className="size-4" aria-hidden />}
      {sound ? "Son activé" : "Activer le son"}
    </button>
  );
}
