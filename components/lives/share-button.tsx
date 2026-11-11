"use client";

import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Partage natif du téléphone (WhatsApp en tête), sinon ouverture de WhatsApp. */
export function ShareButton({ text, path, label = "Partager", className, iconOnly }: { text: string; path: string; label?: string; className?: string; iconOnly?: boolean }) {
  const share = async () => {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: "OCD Live", text, url });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
  };
  return (
    <button
      type="button"
      onClick={share}
      aria-label={iconOnly ? label : undefined}
      className={cn("inline-flex items-center justify-center gap-2 rounded-full border border-border font-semibold transition hover:bg-muted", className)}
    >
      <Share2 className="size-5" aria-hidden />
      {!iconOnly && label}
    </button>
  );
}
