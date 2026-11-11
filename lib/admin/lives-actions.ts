"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { logActivity } from "@/lib/db/activity";
import { reviewLive } from "@/lib/db/lives";
import { extendSubscription } from "@/lib/lives";
import { getServiceClient } from "@/lib/supabase/admin";

export interface LiveActionState {
  ok?: boolean;
  message?: string;
}

/** Valider, refuser ou retirer un live proposé par un abonné. */
export async function reviewLiveAction(_: LiveActionState, form: FormData): Promise<LiveActionState> {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const decision = String(form.get("decision") ?? "");
  if (decision !== "valide" && decision !== "refuse" && decision !== "termine") return { ok: false, message: "Action inconnue." };
  const reason = String(form.get("reason") ?? "").trim().slice(0, 200) || undefined;
  const done = await reviewLive(id, decision, admin.email, reason);
  revalidatePath("/admin/lives");
  revalidatePath("/admin/abonnes");
  if (!done) return { ok: false, message: "Ce live a déjà été traité ou est terminé." };
  return { ok: true, message: decision === "valide" ? "Live validé : il est affiché sur le site." : decision === "refuse" ? "Live refusé." : "Live retiré du site." };
}

/** Suspendre / réactiver un abonné, ou lui offrir 30 jours (geste commercial, paiement hors ligne). */
export async function subscriberAction(_: LiveActionState, form: FormData): Promise<LiveActionState> {
  const admin = await requireAdmin();
  const db = getServiceClient();
  if (!db) return { ok: false, message: "Supabase non configuré." };
  const id = String(form.get("id") ?? "");
  const action = String(form.get("action") ?? "");

  if (action === "suspendre" || action === "reactiver") {
    const status = action === "suspendre" ? "suspendu" : "actif";
    await db.from("subscribers").update({ status }).eq("id", id);
    await logActivity({ entityType: "subscriber", entityId: id, action: `subscriber_${status}`, message: `Abonné ${status === "suspendu" ? "suspendu" : "réactivé"}.`, actor: admin.email });
  } else if (action === "offrir") {
    const { data } = await db.from("subscribers").select("paid_until").eq("id", id).maybeSingle();
    const paidUntil = extendSubscription(data?.paid_until as string | null).toISOString();
    await db.from("subscribers").update({ paid_until: paidUntil }).eq("id", id);
    await logActivity({ entityType: "subscriber", entityId: id, action: "subscription_gifted", message: `Abonnement prolongé à la main jusqu'au ${paidUntil.slice(0, 10)}.`, actor: admin.email });
  } else {
    return { ok: false, message: "Action inconnue." };
  }
  revalidatePath("/admin/lives");
  revalidatePath("/admin/abonnes");
  return { ok: true, message: "C'est fait." };
}
