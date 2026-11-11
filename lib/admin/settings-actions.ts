"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { logActivity } from "@/lib/db/activity";
import { SETTINGS_TAG } from "@/lib/settings";
import { getServiceClient } from "@/lib/supabase/admin";

export interface SettingState {
  ok?: boolean;
  message?: string;
}

/** Ouvrir / fermer le recrutement (onglet du menu, page et formulaire de candidature). */
export async function setRecruitmentAction(_: SettingState, form: FormData): Promise<SettingState> {
  const admin = await requireAdmin();
  const db = getServiceClient();
  if (!db) return { ok: false, message: "Supabase non configuré." };
  const open = form.get("open") === "1";
  const { error } = await db
    .from("app_settings")
    .upsert({ key: "recrutement_ouvert", value: open, updated_at: new Date().toISOString(), updated_by: admin.email }, { onConflict: "key" });
  if (error) return { ok: false, message: "Enregistrement impossible." };
  await logActivity({ entityType: "system", action: "setting_changed", message: `Recrutement ${open ? "ouvert" : "fermé"}.`, actor: admin.email });
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true, message: open ? "Recrutement ouvert." : "Recrutement fermé." };
}
