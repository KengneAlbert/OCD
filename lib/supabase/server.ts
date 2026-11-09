import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/** Client lié aux cookies de session (authentification de l'admin). */
export async function getAuthClient() {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return null;
  const store = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : le middleware rafraîchit la session.
        }
      },
    },
  });
}
