"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase côté navigateur : uniquement pour lancer la connexion (Google, lien magique). */
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
