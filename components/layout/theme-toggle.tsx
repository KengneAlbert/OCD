"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export const THEME_KEY = "ocd-theme";

/** Script inline (dans <head>) : applique le thème choisi avant l'affichage. Clair par défaut. */
export const themeInitScript = `(function(){try{if(localStorage.getItem('${THEME_KEY}')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const [dark, setDark] = useState(false);

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Activer le mode clair" : "Activer le mode sombre"}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-muted-foreground transition hover:bg-ocd-cream hover:text-foreground dark:hover:bg-white/5",
        className,
      )}
    >
      {dark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      {withLabel && <span className="text-sm font-medium">{dark ? "Mode clair" : "Mode sombre"}</span>}
    </button>
  );
}
