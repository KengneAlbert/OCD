import "server-only";
import { getServiceClient } from "@/lib/supabase/admin";
import { logActivity } from "./activity";

/**
 * Pas de réservation sans paiement : une ligne « nouvelle » n'est qu'un créneau
 * bloqué le temps de payer. Passé HOLD_MINUTES sans paiement, elle passe « expiree »
 * (tentative non payée, jamais une réservation) et le créneau redevient libre.
 */
export const HOLD_MINUTES = 20;
/** Durée de vie d'une session Swinmo ouverte pendant le blocage. */
export const PAYMENT_SESSION_MINUTES = 30;

export const holdExpiresAt = (createdAt: string) => new Date(new Date(createdAt).getTime() + HOLD_MINUTES * 60_000);

export const isHoldExpired = (createdAt: string, now = new Date()) => holdExpiresAt(createdAt) <= now;

/**
 * Fait expirer les tentatives non payées dont le blocage est dépassé.
 * Une session de paiement encore ouverte (ou une charge en cours) prolonge le blocage
 * pour ne pas libérer un créneau pendant que le client valide sur son téléphone.
 * Ne lève jamais d'erreur : en cas de souci, le créneau reste simplement bloqué.
 */
export async function releaseExpiredHolds(): Promise<void> {
  const db = getServiceClient();
  if (!db) return;
  try {
    const cutoff = new Date(Date.now() - HOLD_MINUTES * 60_000).toISOString();
    const { data: expired } = await db.from("reservations").select("id, reference").eq("status", "nouvelle").lt("created_at", cutoff).limit(50);
    if (!expired?.length) return;

    const sessionCutoff = new Date(Date.now() - PAYMENT_SESSION_MINUTES * 60_000).toISOString();
    const { data: busy } = await db
      .from("payments")
      .select("reservation_id, status, created_at")
      .in(
        "reservation_id",
        expired.map((r) => r.id),
      )
      .or(`status.eq.succeeded,and(status.in.(open,processing),created_at.gt.${sessionCutoff})`);
    const keep = new Set((busy ?? []).map((p) => p.reservation_id as string));

    for (const r of expired) {
      if (keep.has(r.id)) continue;
      const { data: changed } = await db.from("reservations").update({ status: "expiree" }).eq("id", r.id).eq("status", "nouvelle").select("id");
      if (!changed?.length) continue;
      await logActivity({
        entityType: "reservation",
        entityId: r.id,
        action: "status_changed",
        message: `Créneau libéré : pas de paiement dans les ${HOLD_MINUTES} minutes (tentative non payée).`,
        meta: { from: "nouvelle", to: "expiree", reason: "hold_expired" },
        actor: "Système",
      });
    }
  } catch (e) {
    console.error("[holds.release]", e instanceof Error ? e.message : e);
  }
}
