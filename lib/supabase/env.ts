/** Supabase est optionnel : sans ces variables, le site fonctionne sans stockage (phase 1). */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, anonKey, serviceKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey, serviceKey } = getSupabaseEnv();
  return Boolean(url && anonKey && serviceKey);
}

/** Emails autorisés à se connecter à l'admin (ADMIN_EMAILS, séparés par des virgules). */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
