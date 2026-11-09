import "server-only";
import { redirect } from "next/navigation";
import { getAuthClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/env";

export interface AdminUser {
  id: string;
  email: string;
}

/** Utilisateur connecté ET présent dans ADMIN_EMAILS, sinon null. */
export async function getAdmin(): Promise<AdminUser | null> {
  const supabase = await getAuthClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isAdminEmail(user.email)) return null;
  return { id: user.id, email: user.email };
}

/** À appeler en tête de chaque page / action de l'admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/connexion");
  return admin;
}
