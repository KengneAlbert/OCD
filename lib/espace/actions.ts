"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCountry } from "@/config/countries";
import { getCategory } from "@/config/live-categories";
import { logActivity } from "@/lib/db/activity";
import { getOpenLive, getSubscriber, notifyLiveToReview } from "@/lib/db/lives";
import { currentWindow, isSubscriptionActive, liveExpiry, nextWindowLabel, normalizeHandle, parseLiveUrl, PLATFORMS } from "@/lib/lives";
import { getServiceClient } from "@/lib/supabase/admin";
import { getAuthClient } from "@/lib/supabase/server";
import { digitsOnly } from "@/lib/utils";

export interface EspaceState {
  ok?: boolean;
  message?: string;
}

async function currentUser() {
  const supabase = await getAuthClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email) redirect("/connexion");
  return data.user;
}

/** Photo du compte Google, si elle existe. */
const avatarOf = (meta: Record<string, unknown> | undefined) => {
  const url = meta?.avatar_url ?? meta?.picture;
  return typeof url === "string" && url.startsWith("https://") ? url : null;
};

const str = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

/** Création / mise à jour du profil vendeur. */
export async function saveProfileAction(_: EspaceState, form: FormData): Promise<EspaceState> {
  const user = await currentUser();
  const db = getServiceClient();
  if (!db) return { ok: false, message: "Service indisponible." };

  const fullName = str(form, "fullName", 80);
  const businessName = str(form, "businessName", 80);
  const country = str(form, "country", 2).toUpperCase();
  const city = str(form, "city", 60);
  const category = str(form, "category", 30);
  const handle = normalizeHandle(str(form, "tiktok", 120));
  const phone = digitsOnly(str(form, "phone", 30));
  if (fullName.length < 2) return { ok: false, message: "Indique ton nom." };
  if (businessName.length < 2) return { ok: false, message: "Indique le nom de ton business." };
  if (!getCountry(country)) return { ok: false, message: "Choisis ton pays." };
  if (!getCategory(category)) return { ok: false, message: "Choisis ce que tu vends." };
  if (!handle) return { ok: false, message: "Ton compte TikTok ne marche pas. Exemple : @maboutique" };

  const dial = getCountry(country)?.dialCode ?? "";
  const { error } = await db.from("subscribers").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      business_name: businessName,
      country,
      city: city || null,
      category,
      avatar_url: avatarOf(user.user_metadata),
      tiktok_handle: handle,
      phone_e164: phone.length >= 6 ? `${dial}${phone}` : null,
    },
    { onConflict: "id" },
  );
  if (error) {
    if (error.code === "23505") return { ok: false, message: `Le compte TikTok @${handle} est déjà inscrit. Contacte l'équipe si c'est le tien.` };
    console.error("[espace.profile]", error.message);
    return { ok: false, message: "Enregistrement impossible. Réessaie." };
  }
  await logActivity({ entityType: "subscriber", entityId: user.id, action: "profile_saved", message: `Profil vendeur enregistré (${businessName}).`, actor: user.email! });
  revalidatePath("/moi");
  revalidatePath("/je-suis-en-live");
  return { ok: true, message: "Profil enregistré." };
}

/** « Je suis en live » : pendant les créneaux, abonnement actif, un seul live à la fois. */
export async function submitLiveAction(_: EspaceState, form: FormData): Promise<EspaceState> {
  const user = await currentUser();
  const db = getServiceClient();
  const sub = await getSubscriber(user.id);
  if (!db || !sub) return { ok: false, message: "Complète d'abord ton profil." };
  if (sub.status !== "actif") return { ok: false, message: "Ton compte est suspendu. Contacte l'équipe." };
  if (!isSubscriptionActive(sub.paid_until)) return { ok: false, message: "Renouvelle pour revenir dans l'annuaire." };

  const now = new Date();
  const endsAt = liveExpiry(now);
  if (!currentWindow(now) || !endsAt) return { ok: false, message: `Validation fermée. Prochaine ouverture ${nextWindowLabel(now)}.` };
  if (await getOpenLive(sub.id, now)) return { ok: false, message: "Tu as déjà un live en cours." };

  const link = parseLiveUrl(str(form, "url", 500));
  if (!link) return { ok: false, message: "Ce lien ne marche pas. Copie-le encore dans TikTok." };
  if (link.handle && link.handle !== sub.tiktok_handle) {
    return { ok: false, message: `Ce live n'est pas sur ton compte @${sub.tiktok_handle}.` };
  }
  const country = getCountry(str(form, "country", 2).toUpperCase()) ? str(form, "country", 2).toUpperCase() : sub.country;
  const category = getCategory(str(form, "category", 30)) ? str(form, "category", 30) : sub.category;

  const { data, error } = await db
    .from("live_submissions")
    .insert({
      subscriber_id: sub.id,
      url: link.url,
      platform: link.platform,
      title: getCategory(category)?.label ?? "Live",
      country,
      category,
      ends_at: endsAt.toISOString(),
    })
    .select("id, url, platform, category, country, ends_at")
    .single();
  if (error || !data) {
    console.error("[espace.live]", error?.message);
    return { ok: false, message: "Envoi impossible. Réessaie." };
  }
  await logActivity({
    entityType: "live",
    entityId: data.id,
    action: "live_submitted",
    message: `Live ${PLATFORMS[link.platform].label} envoyé par ${sub.business_name}.`,
    actor: sub.email,
  });
  await notifyLiveToReview(sub, data);
  revalidatePath("/moi");
  revalidatePath("/je-suis-en-live");
  return { ok: true, message: "Envoyé ! L'équipe vérifie ton live." };
}

/** L'abonné indique que son live est terminé (il disparaît du site). */
export async function endMyLiveAction(_: EspaceState, form: FormData): Promise<EspaceState> {
  const user = await currentUser();
  const db = getServiceClient();
  if (!db) return { ok: false, message: "Service indisponible." };
  const id = str(form, "id", 60);
  const { data } = await db
    .from("live_submissions")
    .update({ status: "termine" })
    .eq("id", id)
    .eq("subscriber_id", user.id)
    .in("status", ["en_attente", "valide"])
    .select("id");
  if (!data?.length) return { ok: false, message: "Live introuvable." };
  await logActivity({ entityType: "live", entityId: id, action: "live_termine", message: "Live terminé par le vendeur.", actor: user.email! });
  revalidatePath("/moi");
  revalidatePath("/je-suis-en-live");
  return { ok: true, message: "Live retiré du site." };
}

export async function signOutSubscriberAction() {
  const supabase = await getAuthClient();
  await supabase?.auth.signOut();
  redirect("/connexion");
}
