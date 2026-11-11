"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Recharge les données de la page toutes les `seconds` secondes, seulement quand l'onglet est visible. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
