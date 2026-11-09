import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

let client: SupabaseClient | null = null;

/**
 * Client « service_role » : contourne le RLS. À n'utiliser QUE côté serveur
 * (Route Handlers, Server Actions, Server Components de l'admin).
 */
export function getServiceClient(): SupabaseClient | null {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) return null;
  client ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
