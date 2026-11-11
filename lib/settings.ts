import "server-only";
import { unstable_cache } from "next/cache";
import { getServiceClient } from "@/lib/supabase/admin";

/** Réglages du site modifiables depuis l'admin (table app_settings). */
export interface SiteSettings {
  /** Onglet et page « Recrutement » actifs, candidatures acceptées. */
  recrutementOuvert: boolean;
}

export const SETTINGS_TAG = "settings";
const DEFAULTS: SiteSettings = { recrutementOuvert: true };

/** Lecture mise en cache (invalidée par revalidateTag(SETTINGS_TAG) quand l'admin change un réglage). */
export const getSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const db = getServiceClient();
    if (!db) return DEFAULTS;
    const { data, error } = await db.from("app_settings").select("key, value");
    if (error) return DEFAULTS;
    const map = new Map((data ?? []).map((r) => [r.key as string, r.value as unknown]));
    return { recrutementOuvert: map.has("recrutement_ouvert") ? map.get("recrutement_ouvert") === true : DEFAULTS.recrutementOuvert };
  },
  ["site-settings"],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);
