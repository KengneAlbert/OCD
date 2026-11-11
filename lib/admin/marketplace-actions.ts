"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { marketplaceConfig } from "@/config/marketplace";
import { logActivity } from "@/lib/db/activity";
import { getServiceClient } from "@/lib/supabase/admin";

export interface AdminProductState {
  ok?: boolean;
  message?: string;
}

/** Modération : masquer / réafficher / supprimer un produit de la marketplace. */
export async function moderateProductAction(_: AdminProductState, form: FormData): Promise<AdminProductState> {
  const admin = await requireAdmin();
  const db = getServiceClient();
  if (!db) return { ok: false, message: "Supabase non configuré." };
  const id = String(form.get("id") ?? "");
  const action = String(form.get("action") ?? "");
  const { data: product } = await db.from("products").select("id, title, image_path").eq("id", id).maybeSingle();
  if (!product) return { ok: false, message: "Produit introuvable." };

  if (action === "masquer" || action === "afficher") {
    await db.from("products").update({ hidden_by_admin: action === "masquer" }).eq("id", id);
    await logActivity({ entityType: "product", entityId: id, action: `product_${action}`, message: `« ${product.title} » ${action === "masquer" ? "masqué" : "réaffiché"} par l'équipe.`, actor: admin.email });
  } else if (action === "supprimer") {
    await db.from("products").delete().eq("id", id);
    const path = product.image_path as string | null;
    if (path && !path.startsWith("/") && !path.startsWith("https://")) await db.storage.from(marketplaceConfig.bucket).remove([path]);
    await logActivity({ entityType: "product", entityId: id, action: "product_deleted", message: `« ${product.title} » supprimé par l'équipe.`, actor: admin.email });
  } else {
    return { ok: false, message: "Action inconnue." };
  }
  revalidatePath("/admin/marketplace");
  revalidatePath("/marketplace");
  return { ok: true, message: "C'est fait." };
}
