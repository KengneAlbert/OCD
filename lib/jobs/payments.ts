import "server-only";
import { releaseExpiredHolds, isHoldExpired } from "@/lib/db/holds";
import { getSubscriber } from "@/lib/db/lives";
import { rowToReservationLike } from "@/lib/db/reservations";
import type { ReservationRow } from "@/lib/db/types";
import { reservationPaymentEmail, subscriptionPaymentEmail } from "@/lib/emails/payments";
import { sendEmail } from "@/lib/emails/send";
import { toReservationView } from "@/lib/emails/templates";
import { isSubscriptionActive } from "@/lib/lives";
import { dueReminder, RESERVATION_REMINDERS, SUBSCRIPTION_REMINDERS } from "@/lib/payments/rules";
import { findChargeByReference, getSession, isPaymentEnabled } from "@/lib/payments/swinmo";
import { verifyTransactionWithProvider } from "@/lib/payments/verify";
import { getServiceClient } from "@/lib/supabase/admin";

export interface PaymentsJobResult {
  reconciled: number;
  expired: number;
  errors: number;
  reservationReminders: number;
  subscriptionReminders: number;
}

const DAY = 86_400_000;
/** Une session Swinmo vit 30 min : au-delà de 3 jours, une tentative non finale n'a plus d'intérêt. */
const RECONCILE_WINDOW = 3 * DAY;
const BATCH = 50;

type Pending = { id: string; reference: string; session_id: string | null; charge_id: string | null; created_at: string };

/**
 * Rapprochement : relit chez Swinmo les tentatives restées « open » / « processing »
 * (webhook perdu, client parti avant le retour). Swinmo n'envoie chaque webhook qu'une fois.
 */
async function reconcile(now: Date): Promise<Pick<PaymentsJobResult, "reconciled" | "expired" | "errors">> {
  const db = getServiceClient();
  const out = { reconciled: 0, expired: 0, errors: 0 };
  if (!db || !isPaymentEnabled()) return out;
  const since = new Date(now.getTime() - RECONCILE_WINDOW).toISOString();

  for (const table of ["payments", "subscription_payments"] as const) {
    const { data } = await db
      .from(table)
      .select("id, reference, session_id, charge_id, created_at")
      .in("status", ["open", "processing"])
      .gt("created_at", since)
      .order("created_at")
      .limit(BATCH);
    for (const p of (data ?? []) as Pending[]) {
      try {
        let chargeId = p.charge_id;
        if (!chargeId && p.session_id) {
          const session = await getSession(p.session_id);
          chargeId = session.charge_id ?? null;
          if (!chargeId && session.status === "expired") {
            await db.from(table).update({ status: "expired", verified_at: now.toISOString() }).eq("id", p.id).in("status", ["open", "processing"]);
            out.expired += 1;
            continue;
          }
        }
        // Session jamais rattachée (cas rare) : on cherche la charge par sa référence une fois la session expirée.
        if (!chargeId && !p.session_id && now.getTime() - new Date(p.created_at).getTime() > 35 * 60_000) {
          chargeId = (await findChargeByReference(p.reference))?.id ?? null;
          if (!chargeId) {
            await db.from(table).update({ status: "expired", verified_at: now.toISOString() }).eq("id", p.id).in("status", ["open", "processing"]);
            out.expired += 1;
            continue;
          }
        }
        if (!chargeId) continue; // session encore ouverte, rien de payé pour l'instant
        const outcome = await verifyTransactionWithProvider(chargeId, "rapprochement");
        if (outcome.ok) out.reconciled += 1;
      } catch (e) {
        out.errors += 1;
        console.error("[payments.reconcile]", p.reference, e instanceof Error ? e.message : e);
      }
    }
  }
  return out;
}

/**
 * Relances des réservations non payées : 5 min (« termine ton paiement », créneau encore bloqué),
 * puis 1 h, 1 j, 3 j (« créneau libéré, réserve à nouveau »). Arrêt dès que c'est payé
 * ou que le client a réservé (et payé) un autre live.
 */
async function remindReservations(now: Date): Promise<number> {
  const db = getServiceClient();
  if (!db) return 0;
  const plan = RESERVATION_REMINDERS;
  const since = new Date(now.getTime() - plan.maxAgeMinutes * 60_000).toISOString();
  const { data } = await db
    .from("reservations")
    .select("*")
    .in("status", ["nouvelle", "expiree"])
    .not("email", "is", null)
    .lt("reminder_count", plan.offsets.length)
    .gt("created_at", since)
    .order("created_at")
    .limit(100);

  let sent = 0;
  for (const r of (data ?? []) as (ReservationRow & { reminder_count: number })[]) {
    const due = dueReminder(new Date(r.created_at), r.reminder_count, now, plan);
    if (!due) continue;

    // Payée entre-temps (paiement réussi ou en cours de validation) → plus de relance.
    const { data: attempts } = await db.from("payments").select("status").eq("reservation_id", r.id).in("status", ["succeeded", "processing", "amount_mismatch"]);
    // A déjà réservé et payé un autre live depuis → plus de relance.
    const { count: rebooked } = await db
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("email", r.email!)
      .in("status", ["payee", "confirmee", "realisee"])
      .gt("created_at", r.created_at);
    if (attempts?.length || (rebooked ?? 0) > 0) {
      await db.from("reservations").update({ reminder_count: plan.offsets.length }).eq("id", r.id);
      continue;
    }

    // Verrou optimiste : une seule exécution envoie cette relance.
    const { data: locked } = await db
      .from("reservations")
      .update({ reminder_count: due.skipTo, last_reminder_at: now.toISOString() })
      .eq("id", r.id)
      .eq("reminder_count", r.reminder_count)
      .select("id");
    if (!locked?.length) continue;

    const canPay = r.status === "nouvelle" && !isHoldExpired(r.created_at, now);
    const res = await sendEmail({
      template: "paiement-relance",
      to: { email: r.email!, name: r.full_name },
      content: reservationPaymentEmail(toReservationView(rowToReservationLike(r)), "reminder", canPay),
      entity: { type: "reservation", id: r.id },
      actor: `Relance ${due.index + 1}/${plan.offsets.length}`,
    });
    if (res.ok) sent += 1;
  }
  return sent;
}

/**
 * Relances des paiements d'abonnement abandonnés ou échoués : 5 min, 1 h, 1 j, 3 j, 7 j ; arrêt à 14 j,
 * dès que l'abonnement est actif, ou quand une tentative plus récente existe.
 */
async function remindSubscriptions(now: Date): Promise<number> {
  const db = getServiceClient();
  if (!db) return 0;
  const plan = SUBSCRIPTION_REMINDERS;
  const since = new Date(now.getTime() - plan.maxAgeMinutes * 60_000).toISOString();
  const { data } = await db
    .from("subscription_payments")
    .select("id, subscriber_id, created_at, reminder_count")
    .in("status", ["open", "failed", "expired"])
    .lt("reminder_count", plan.offsets.length)
    .gt("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100);

  let sent = 0;
  const seen = new Set<string>();
  for (const p of (data ?? []) as { id: string; subscriber_id: string; created_at: string; reminder_count: number }[]) {
    // Seule la tentative la plus récente d'un abonné est relancée.
    if (seen.has(p.subscriber_id)) continue;
    seen.add(p.subscriber_id);
    const due = dueReminder(new Date(p.created_at), p.reminder_count, now, plan);
    if (!due) continue;

    const sub = await getSubscriber(p.subscriber_id);
    const { count: newer } = await db
      .from("subscription_payments")
      .select("id", { count: "exact", head: true })
      .eq("subscriber_id", p.subscriber_id)
      .gt("created_at", p.created_at)
      .in("status", ["succeeded", "processing", "open"]);
    if (!sub || sub.status !== "actif" || isSubscriptionActive(sub.paid_until, now) || (newer ?? 0) > 0) {
      await db.from("subscription_payments").update({ reminder_count: plan.offsets.length }).eq("id", p.id);
      continue;
    }

    const { data: locked } = await db
      .from("subscription_payments")
      .update({ reminder_count: due.skipTo, last_reminder_at: now.toISOString() })
      .eq("id", p.id)
      .eq("reminder_count", p.reminder_count)
      .select("id");
    if (!locked?.length) continue;

    const res = await sendEmail({
      template: "abonnement-relance",
      to: { email: sub.email, name: sub.full_name },
      content: subscriptionPaymentEmail({ firstName: sub.full_name.split(" ")[0] ?? "" }, "reminder"),
      entity: { type: "subscriber", id: sub.id },
      actor: `Relance ${due.index + 1}/${plan.offsets.length}`,
    });
    if (res.ok) sent += 1;
  }
  return sent;
}

/** Tâche des paiements (toutes les 5 min, via Supabase pg_cron → /api/cron/payments). */
export async function runPaymentsJob(now = new Date()): Promise<PaymentsJobResult> {
  await releaseExpiredHolds();
  const rec = await reconcile(now);
  const [reservationReminders, subscriptionReminders] = await Promise.all([remindReservations(now), remindSubscriptions(now)]);
  return { ...rec, reservationReminders, subscriptionReminders };
}
