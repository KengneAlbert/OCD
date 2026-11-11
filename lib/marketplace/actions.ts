"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCategory } from "@/config/live-categories";
import { marketplaceConfig } from "@/config/marketplace";
import { logActivity } from "@/lib/db/activity";
import { getSubscriber } from "@/lib/db/lives";
import { getMyProduct, listMyProducts } from "@/lib/db/marketplace";
import { isSubscriptionActive } from "@/lib/lives";
import { getServiceClient } from "@/lib/supabase/admin";
import { getAuthClient } from "@/lib/supabase/server";

export interface ProductState {
  ok?: boolean;
  message?: string;
}

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function currentSubscriber() {
  const supabase = await getAuthClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email) redirect("/connexion?suite=/moi/produits");
  const sub = await getSubscriber(data.user.id);
  if (!sub) redirect("/moi");
  return sub;
}

function refresh() {
  revalidatePath("/moi/produits");
  revalidatePath("/marketplace");
}

/** Envoie la photo dans le bucket ; retourne le chemin ou un message d'erreur. */
async function uploadImage(subscriberId: string, file: File): Promise<{ path?: string; error?: string }> {
  const ext = TYPES[file.type];
  if (!ext) return { error: "Photo en JPG, PNG ou WebP." };
  if (file.size > marketplaceConfig.maxImageMb * 1024 * 1024) return { error: `Photo trop lourde (${marketplaceConfig.maxImageMb} Mo max).` };
  const db = getServiceClient();
  if (!db) return { error: "Service indisponible." };
  const path = `${subscriberId}/${randomUUID()}.${ext}`;
  const { error } = await db.storage.from(marketplaceConfig.bucket).upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (error) {
    console.error("[marketplace.upload]", error.message);
    return { error: "Envoi de la photo impossible. Réessaie." };
  }
  return { path };
}

async function removeImage(path: string | null) {
  if (!path || path.startsWith("/") || path.startsWith("https://")) return;
  await getServiceClient()?.storage.from(marketplaceConfig.bucket).remove([path]);
}

const str = (f: FormData, k: string, max: number) => String(f.get(k) ?? "").trim().slice(0, max);

/** Ajouter ou modifier un produit / service. */
export async function saveProductAction(_: ProductState, form: FormData): Promise<ProductState> {
  const sub = await currentSubscriber();
  const db = getServiceClient();
  if (!db) return { ok: false, message: "Service indisponible." };

  const id = str(form, "id", 40);
  const existing = id ? await getMyProduct(sub.id, id) : null;
  if (id && !existing) return { ok: false, message: "Produit introuvable." };

  if (!existing) {
    if (!isSubscriptionActive(sub.paid_until)) return { ok: false, message: "Active ton abonnement pour publier." };
    if ((await listMyProducts(sub.id)).length >= marketplaceConfig.maxProducts) {
      return { ok: false, message: `${marketplaceConfig.maxProducts} produits maximum. Supprime-en un d'abord.` };
    }
  }

  const title = str(form, "title", 80);
  const description = str(form, "description", 500);
  const kind = str(form, "kind", 10) === "service" ? "service" : "produit";
  const category = getCategory(str(form, "category", 30)) ? str(form, "category", 30) : sub.category;
  const priceRaw = str(form, "price", 12).replace(/\D/g, "");
  const price = priceRaw ? Number(priceRaw) : null;
  if (title.length < 3) return { ok: false, message: "Donne un nom à ton produit." };
  if (price !== null && (!Number.isSafeInteger(price) || price > 100_000_000)) return { ok: false, message: "Ce prix ne marche pas." };

  const file = form.get("image");
  const hasFile = file instanceof File && file.size > 0;
  if (!existing && !hasFile) return { ok: false, message: "Ajoute une photo." };

  let imagePath = existing?.image_path ?? null;
  if (hasFile) {
    const up = await uploadImage(sub.id, file);
    if (up.error) return { ok: false, message: up.error };
    imagePath = up.path!;
  }

  const values = { title, description: description || null, kind, category, price, image_path: imagePath };
  if (existing) {
    const { error } = await db.from("products").update(values).eq("id", existing.id).eq("subscriber_id", sub.id);
    if (error) return { ok: false, message: "Enregistrement impossible. Réessaie." };
    if (hasFile) await removeImage(existing.image_path);
  } else {
    const { data, error } = await db
      .from("products")
      .insert({ ...values, subscriber_id: sub.id })
      .select("id")
      .single();
    if (error || !data) {
      await removeImage(imagePath);
      console.error("[marketplace.insert]", error?.message);
      return { ok: false, message: "Enregistrement impossible. Réessaie." };
    }
    await logActivity({ entityType: "product", entityId: data.id, action: "product_created", message: `${sub.business_name} a publié « ${title} ».`, actor: sub.email });
  }
  refresh();
  if (!existing) redirect("/moi/produits?ajoute=1");
  return { ok: true, message: "Enregistré." };
}

/** Masquer / réafficher un de ses produits. */
export async function toggleProductAction(_: ProductState, form: FormData): Promise<ProductState> {
  const sub = await currentSubscriber();
  const product = await getMyProduct(sub.id, str(form, "id", 40));
  if (!product) return { ok: false, message: "Produit introuvable." };
  const status = product.status === "actif" ? "masque" : "actif";
  await getServiceClient()?.from("products").update({ status }).eq("id", product.id);
  refresh();
  return { ok: true, message: status === "actif" ? "Visible." : "Masqué." };
}

/** Supprimer un de ses produits (et sa photo). */
export async function deleteProductAction(_: ProductState, form: FormData): Promise<ProductState> {
  const sub = await currentSubscriber();
  const product = await getMyProduct(sub.id, str(form, "id", 40));
  if (!product) return { ok: false, message: "Produit introuvable." };
  await getServiceClient()?.from("products").delete().eq("id", product.id);
  await removeImage(product.image_path);
  await logActivity({ entityType: "product", entityId: product.id, action: "product_deleted", message: `${sub.business_name} a supprimé « ${product.title} ».`, actor: sub.email });
  refresh();
  redirect("/moi/produits");
}
