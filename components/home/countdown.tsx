"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";

const pad = (n: number) => String(n).padStart(2, "0");

/** Compte à rebours façon timecode de caméra : J-23 · 14:05:33 */
export function Timecode({ className }: { className?: string }) {
  const target = new Date(siteConfig.launchDate).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const total = now === null ? null : Math.max(0, target - now);
  if (total === 0) {
    return <span className={className}>EN DIRECT · Les lives ont commencé</span>;
  }

  const d = total === null ? null : Math.floor(total / 86_400_000);
  const h = total === null ? null : Math.floor((total / 3_600_000) % 24);
  const mi = total === null ? null : Math.floor((total / 60_000) % 60);
  const s = total === null ? null : Math.floor((total / 1000) % 60);

  return (
    <span
      role="timer"
      aria-live="off"
      aria-label={d === null ? "Lancement le 1er décembre" : `Lancement dans ${d} jours, ${h} heures et ${mi} minutes`}
      className={className}
    >
      <span aria-hidden className="tabular-nums">
        {d === null ? "J-–– · ––:––:––" : `J-${pad(d)} · ${pad(h!)}:${pad(mi!)}:${pad(s!)}`}
      </span>
    </span>
  );
}
