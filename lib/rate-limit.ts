/**
 * Rate limiting simple en mémoire (fenêtre glissante par IP).
 * Suffisant contre le spam basique ; sur Vercel chaque instance a sa propre
 * mémoire → passer à Upstash/Redis si besoin d'une limite globale.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60_000, now = Date.now()): { allowed: boolean; retryAfter: number } {
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - hits[0]!)) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return { allowed: true, retryAfter: 0 };
}

export function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "anonyme";
}
