"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logActivity } from "@/lib/db/activity";
import {
  getCandidature,
  getReservation,
  rowToCandidatureLike,
  rowToReservationLike,
  setReservationStatus,
} from "@/lib/db/reservations";
import { sendEmail, type SendEmailInput } from "@/lib/emails/send";
import {
  candidatureUpdateEmail,
  reservationCancelledEmail,
  reservationConfirmedEmail,
  reservationPaidEmail,
  reservationReminderEmail,
  reservationThanksEmail,
  toCandidatureView,
  toReservationView,
} from "@/lib/emails/templates";
import { getServiceClient } from "@/lib/supabase/admin";
import { getAuthClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/supabase/env";
import { requireAdmin } from "./auth";
import {
  candidatureStatusMeta,
  isCandidatureStatus,
  isReservationStatus,
  MANUAL_RESERVATION_STATUSES,
  reservationStatusMeta,
  type ReservationStatus,
} from "./status";

export interface ActionState {
  ok?: boolean;
  message?: string;
}

/* ─── Connexion ────────────────────────────────────────────────────────── */

const loginSchema = z.object({
  email: z.string().trim().email("Adresse email invalide."),
  password: z.string().min(6, "Mot de passe trop court."),
  suite: z.string().optional(),
});

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message };
  const { email, password, suite } = parsed.data;

  if (!isAdminEmail(email)) return { ok: false, message: "Cet email n'a pas accès à l'espace admin." };

  const supabase = await getAuthClient();
  if (!supabase) return { ok: false, message: "Supabase n'est pas configuré sur ce serveur." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: "Email ou mot de passe incorrect." };

  await logActivity({ entityType: "system", action: "login", message: `Connexion à l'admin`, actor: email });
  redirect(suite?.startsWith("/admin") ? suite : "/admin");
}

export async function signOutAction() {
  const supabase = await getAuthClient();
  await supabase?.auth.signOut();
  redirect("/admin/connexion");
}

/* ─── Réservations ─────────────────────────────────────────────────────── */

const RESERVATION_EMAILS: Partial<Record<ReservationStatus, SendEmailInput["template"]>> = {
  confirmee: "reservation-confirmee",
  payee: "reservation-payee",
  realisee: "reservation-merci",
  annulee: "reservation-annulee",
};

export async function updateReservationStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  const notify = formData.get("notify") === "on";
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || undefined;
  if (!isReservationStatus(status) || !(MANUAL_RESERVATION_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, message: "Statut invalide." };
  }

  const row = await getReservation(id);
  if (!row) return { ok: false, message: "Réservation introuvable." };
  if (row.status === status) return { ok: false, message: "La réservation a déjà ce statut." };

  try {
    await setReservationStatus(id, status);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Mise à jour impossible." };
  }

  await logActivity({
    entityType: "reservation",
    entityId: id,
    action: "status_changed",
    message: `Statut : ${reservationStatusMeta[row.status].label} → ${reservationStatusMeta[status].label}${note ? ` · « ${note} »` : ""}`,
    meta: { from: row.status, to: status, note },
    actor: admin.email,
  });

  let message = `Statut passé à « ${reservationStatusMeta[status].label} ».`;
  const template = RESERVATION_EMAILS[status];
  if (notify && template) {
    if (!row.email) {
      message += " Pas d'email client : préviens-le sur WhatsApp.";
    } else {
      const view = toReservationView(rowToReservationLike(row));
      const content =
        status === "confirmee"
          ? reservationConfirmedEmail(view, note)
          : status === "payee"
            ? reservationPaidEmail(view)
            : status === "realisee"
              ? reservationThanksEmail(view)
              : reservationCancelledEmail(view, note);
      const sent = await sendEmail({
        template,
        to: { email: row.email, name: row.full_name },
        content,
        entity: { type: "reservation", id },
        actor: admin.email,
      });
      message += sent.ok ? " Email envoyé au client." : ` L'email n'a pas pu partir (${sent.error}).`;
    }
  }

  revalidatePath("/admin", "layout");
  return { ok: true, message };
}

export async function sendReservationReminderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const row = await getReservation(id);
  if (!row) return { ok: false, message: "Réservation introuvable." };
  if (!row.email) return { ok: false, message: "Ce client n'a pas laissé d'email." };
  const sent = await sendEmail({
    template: "reservation-rappel",
    to: { email: row.email, name: row.full_name },
    content: reservationReminderEmail(toReservationView(rowToReservationLike(row))),
    entity: { type: "reservation", id },
    actor: admin.email,
  });
  revalidatePath(`/admin/reservations/${id}`);
  return sent.ok ? { ok: true, message: "Rappel envoyé." } : { ok: false, message: sent.error };
}

/* ─── Notes (réservations et candidatures) ─────────────────────────────── */

export async function saveNotesAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const entity = formData.get("entity") === "candidature" ? "candidature" : "reservation";
  const notes = String(formData.get("notes") ?? "").slice(0, 4000);
  const db = getServiceClient();
  if (!db) return { ok: false, message: "Supabase non configuré." };

  const { error } = await db
    .from(entity === "candidature" ? "candidatures" : "reservations")
    .update({ admin_notes: notes || null })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await logActivity({ entityType: entity, entityId: id, action: "note_updated", message: "Notes internes mises à jour.", actor: admin.email });
  revalidatePath(`/admin/${entity === "candidature" ? "candidatures" : "reservations"}/${id}`);
  return { ok: true, message: "Notes enregistrées." };
}

/* ─── Candidatures ─────────────────────────────────────────────────────── */

export async function updateCandidatureStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status");
  const notify = formData.get("notify") === "on";
  const note = String(formData.get("note") ?? "").trim().slice(0, 500) || undefined;
  if (!isCandidatureStatus(status)) return { ok: false, message: "Statut invalide." };

  const row = await getCandidature(id);
  if (!row) return { ok: false, message: "Candidature introuvable." };
  if (row.status === status) return { ok: false, message: "La candidature a déjà ce statut." };

  const db = getServiceClient();
  if (!db) return { ok: false, message: "Supabase non configuré." };
  const { error } = await db.from("candidatures").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };

  await logActivity({
    entityType: "candidature",
    entityId: id,
    action: "status_changed",
    message: `Statut : ${candidatureStatusMeta[row.status].label} → ${candidatureStatusMeta[status].label}${note ? ` · « ${note} »` : ""}`,
    meta: { from: row.status, to: status, note },
    actor: admin.email,
  });

  let message = `Statut passé à « ${candidatureStatusMeta[status].label} ».`;
  const emailStatus = status === "entretien" || status === "retenue" || status === "refusee" ? status : null;
  if (notify && emailStatus) {
    if (!row.email) {
      message += " Pas d'email : préviens la candidate sur WhatsApp.";
    } else {
      const template = emailStatus === "entretien" ? "candidature-essai" : emailStatus === "retenue" ? "candidature-retenue" : "candidature-refusee";
      const sent = await sendEmail({
        template,
        to: { email: row.email, name: row.full_name },
        content: candidatureUpdateEmail(toCandidatureView(rowToCandidatureLike(row)), emailStatus, note),
        entity: { type: "candidature", id },
        actor: admin.email,
      });
      message += sent.ok ? " Email envoyé." : ` L'email n'a pas pu partir (${sent.error}).`;
    }
  }

  revalidatePath("/admin", "layout");
  return { ok: true, message };
}

/* ─── Paiements ────────────────────────────────────────────────────────── */

/**
 * Rattrapage : relit chez Swinmo l'état des tentatives non abouties de la réservation
 * (les webhooks Swinmo ne sont jamais renvoyés en cas d'échec de livraison).
 */
export async function verifyPaymentsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const { listPayments, applyCharge, markPaymentExpired } = await import("@/lib/db/payments");
  const { getCharge, getSession, findChargeByReference, isPaymentEnabled } = await import("@/lib/payments/swinmo");
  if (!isPaymentEnabled()) return { ok: false, message: "Swinmo Pay n'est pas configuré." };

  const pending = (await listPayments(id)).filter((p) => p.status !== "succeeded" && p.status !== "failed");
  if (pending.length === 0) return { ok: true, message: "Aucune tentative en attente à vérifier." };

  const results: string[] = [];
  for (const p of pending) {
    try {
      let chargeId = p.charge_id;
      if (!chargeId && p.session_id) {
        const session = await getSession(p.session_id);
        chargeId = session.charge_id ?? null;
        if (!chargeId && session.status === "expired") {
          await markPaymentExpired(p.id);
          results.push(`${p.reference} : session expirée sans paiement`);
          continue;
        }
      }
      const charge = chargeId ? await getCharge(chargeId) : await findChargeByReference(p.reference);
      if (!charge) {
        results.push(`${p.reference} : aucun paiement lancé pour l'instant`);
        continue;
      }
      const r = await applyCharge(charge, "vérification admin");
      results.push(`${p.reference} : ${charge.status === "succeeded" ? "payé" : charge.status === "failed" ? "échoué" : "en cours"}${r === "mismatch" ? " (incohérent)" : ""}`);
    } catch (e) {
      results.push(`${p.reference} : erreur (${e instanceof Error ? e.message : "inconnue"})`);
    }
  }
  revalidatePath(`/admin/reservations/${id}`);
  return { ok: true, message: results.join(" · ") };
}
