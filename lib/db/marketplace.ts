import "server-only";
import { getCountry } from "@/config/countries";
import { marketplaceConfig } from "@/config/marketplace";
import { getServiceClient } from "@/lib/supabase/admin";

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type ProductKind = "produit" | "service";

export interface ProductRow {
  id: string;
  subscriber_id: string;
  kind: ProductKind;
  title: string;
  description: string | null;
  price: number | null;
  category: string;
  image_path: string | null;
  status: "actif" | "masque";
  hidden_by_admin: boolean;
  created_at: string;
}

export interface PublicVendor {
  id: string;
  businessName: string;
  city: string | null;
  country: string;
  countryName: string;
  whatsapp: string | null;
  tiktokHandle: string;
  avatarUrl: string | null;
  /** Lien du live TikTok si le vendeur est en live en ce moment. */
  liveUrl: string | null;
}

export interface PublicProduct {
  id: string;
  kind: ProductKind;
  title: string;
  description: string | null;
  price: number | null;
  category: string;
  imageUrl: string | null;
  vendor: PublicVendor;
}

type Joined = ProductRow & {
  subscriber: {
    id: string;
    business_name: string;
    city: string | null;
    country: string;
    phone_e164: string | null;
    tiktok_handle: string;
    avatar_url: string | null;
    status: string;
    paid_until: string | null;
  };
};

const VENDOR_FIELDS = "id, business_name, city, country, phone_e164, tiktok_handle, avatar_url, status, paid_until";

/** URL publique d'une photo (chemin du bucket, ou image locale « /… » pour les données de démo). */
export function productImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/") || path.startsWith("https://")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${marketplaceConfig.bucket}/${path}`;
}

/** Vendeurs actuellement en live (validé, non expiré) → lien du live. */
async function liveUrls(vendorIds: string[], now: Date): Promise<Map<string, string>> {
  const db = getServiceClient();
  if (!db || !vendorIds.length) return new Map();
  const { data } = await db
    .from("live_submissions")
    .select("subscriber_id, url")
    .eq("status", "valide")
    .gt("ends_at", now.toISOString())
    .in("subscriber_id", vendorIds);
  return new Map((data ?? []).map((l) => [l.subscriber_id as string, l.url as string]));
}

function toPublic(row: Joined, lives: Map<string, string>): PublicProduct {
  const s = row.subscriber;
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    description: row.description,
    price: row.price,
    category: row.category,
    imageUrl: productImageUrl(row.image_path),
    vendor: {
      id: s.id,
      businessName: s.business_name,
      city: s.city,
      country: s.country,
      countryName: getCountry(s.country)?.name ?? s.country,
      whatsapp: s.phone_e164 ? s.phone_e164.replace(/\D/g, "") : null,
      tiktokHandle: s.tiktok_handle,
      avatarUrl: s.avatar_url,
      liveUrl: lives.get(s.id) ?? null,
    },
  };
}

/* ─── Public ───────────────────────────────────────────────────────────── */

export interface MarketplaceFilters {
  country?: string;
  category?: string;
  kind?: ProductKind;
  q?: string;
}

/**
 * Produits visibles : actifs, non masqués par l'équipe, d'un abonné actif (abonnement payé, non suspendu)
 * qui a renseigné un numéro WhatsApp.
 */
export async function listMarketplace(filters: MarketplaceFilters = {}, now = new Date()): Promise<PublicProduct[]> {
  const db = getServiceClient();
  if (!db) return [];
  let q = db
    .from("products")
    .select(`*, subscriber:subscribers!inner(${VENDOR_FIELDS})`)
    .eq("status", "actif")
    .eq("hidden_by_admin", false)
    .eq("subscriber.status", "actif")
    .gt("subscriber.paid_until", now.toISOString())
    .not("subscriber.phone_e164", "is", null)
    .order("created_at", { ascending: false })
    .limit(120);
  if (filters.country) q = q.eq("subscriber.country", filters.country);
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.kind) q = q.eq("kind", filters.kind);
  if (filters.q) {
    const term = filters.q.replace(/[%_,()]/g, " ").trim().slice(0, 60);
    if (term) q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }
  const { data, error } = await q;
  if (error) console.error("[marketplace.list]", error.message);
  const rows = (data ?? []) as unknown as Joined[];
  const lives = await liveUrls([...new Set(rows.map((r) => r.subscriber_id))], now);
  return rows.map((r) => toPublic(r, lives));
}

/** Pays ayant au moins un produit visible (pour le filtre). */
export async function marketplaceCountries(now = new Date()): Promise<{ code: string; name: string; count: number }[]> {
  const all = await listMarketplace({}, now);
  const counts = new Map<string, number>();
  for (const p of all) counts.set(p.vendor.country, (counts.get(p.vendor.country) ?? 0) + 1);
  return [...counts.entries()]
    .map(([code, count]) => ({ code, name: getCountry(code)?.name ?? code, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fr"));
}

/** Un produit visible, avec les autres produits du même vendeur. */
export async function getPublicProduct(id: string, now = new Date()): Promise<{ product: PublicProduct; others: PublicProduct[] } | null> {
  const db = getServiceClient();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db
    .from("products")
    .select(`*, subscriber:subscribers!inner(${VENDOR_FIELDS})`)
    .eq("id", id)
    .eq("status", "actif")
    .eq("hidden_by_admin", false)
    .maybeSingle();
  const row = data as unknown as Joined | null;
  if (!row || row.subscriber.status !== "actif" || !row.subscriber.paid_until || new Date(row.subscriber.paid_until) <= now || !row.subscriber.phone_e164) {
    return null;
  }
  const { data: more } = await db
    .from("products")
    .select(`*, subscriber:subscribers!inner(${VENDOR_FIELDS})`)
    .eq("subscriber_id", row.subscriber_id)
    .eq("status", "actif")
    .eq("hidden_by_admin", false)
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(8);
  const lives = await liveUrls([row.subscriber_id], now);
  return { product: toPublic(row, lives), others: ((more ?? []) as unknown as Joined[]).map((r) => toPublic(r, lives)) };
}

/* ─── Vendeur ──────────────────────────────────────────────────────────── */

export async function listMyProducts(subscriberId: string): Promise<ProductRow[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data } = await db.from("products").select("*").eq("subscriber_id", subscriberId).order("created_at", { ascending: false });
  return (data ?? []) as ProductRow[];
}

export async function getMyProduct(subscriberId: string, id: string): Promise<ProductRow | null> {
  const db = getServiceClient();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await db.from("products").select("*").eq("id", id).eq("subscriber_id", subscriberId).maybeSingle();
  return (data as ProductRow) ?? null;
}

/* ─── Admin ────────────────────────────────────────────────────────────── */

export async function listProductsForAdmin(): Promise<Joined[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data } = await db.from("products").select(`*, subscriber:subscribers(${VENDOR_FIELDS})`).order("created_at", { ascending: false }).limit(300);
  return (data ?? []) as unknown as Joined[];
}
