import "server-only";
import { redirect } from "next/navigation";
import { getSubscriber } from "@/lib/db/lives";
import { getAuthClient } from "@/lib/supabase/server";

/** Abonné connecté pour les pages « Mes produits » (sinon connexion, ou création du profil). */
export async function requireVendor(suite = "/moi/produits") {
  const supabase = await getAuthClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email) redirect(`/connexion?suite=${encodeURIComponent(suite)}`);
  const sub = await getSubscriber(data.user.id);
  if (!sub) redirect("/moi");
  return sub;
}
