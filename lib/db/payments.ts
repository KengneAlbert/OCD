import "server-only";
import { randomBytes } from "node:crypto";
import { siteConfig } from "@/config/site";
import { sendEmail } from "@/lib/emails/send";
import { reservationPaidEmail, toReservationView } from "@/lib/emails/templates";
import { createCheckoutSession, getSwinmoEnv, operatorLabel, XOF_COUNTRIES, type SwinmoCharge } from "@/lib/payments/swinmo";
import { getServiceClient } from "@/lib/supabase/admin";
import { logActivity } from "./activity";
import { rowToReservationLike } from "./reservations";
import type { ReservationRow } from "./types";

export interface PaymentRow {
  id: string;
  reservation_id: string;
  provider: string;
  environment: string;
  session_id: string | null;
  charge_id: string | null;
  reference: string;
  status: "open" | "processing" | "succeeded" | "failed" | "expired";
  amount: number;
  currency: string;
  fee: number | null;
  net: number | null;
  operator: string | null;
  phone: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Statuts de réservation pour lesquels on peut encore payer. */
const PAYABLE = new Set(["nouvelle", "confirmee"]);

export const payUrlFor = (token: string) => `${siteConfig.url}/paiement/${token}`;

export async function getReservationByToken(token: string): Promise<(ReservationRow & { pay_token: string }) | null> {
  if (!/^[0-9a-f]{20,64}$/.test(token)) return null;
  const db = getServiceClient();
  if (!db) return null;
  const { data } = await db.from("reservations").select("*").eq("pay_token", token).maybeSingle();
  return (data as ReservationRow & { pay_token: string }) ?? null;
}

export async function listPayments(reservationId: string): Promise<PaymentRow[]> {
  const db = getServiceClient();
  if (!db) return [];
  const { data } = await db.from("payments").select("*").eq("reservation_id", reservationId).order("created_at", { ascending: false });
  return (data ?? []) as PaymentRow[];
}

export async function hasSucceededPayment(reservationId: string): Promise<boolean> {
  const db = getServiceClient();
  if (!db) return false;
  const { count } = await db
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("reservation_id", reservationId)
    .eq("status", "succeeded");
  return (count ?? 0) > 0;
}

export type PayState = "payable" | "paid" | "closed";

export async function getPayState(row: ReservationRow): Promise<PayState> {
  if (row.status === "payee" || row.status === "realisee" || (await hasSucceededPayment(row.id))) return "paid";
  return PAYABLE.has(row.status) ? "payable" : "closed";
}

/**
 * Crée une session de paiement Swinmo pour une réservation.
 * Le montant vient TOUJOURS de la base (prix figé à la réservation), jamais du navigateur.
 */
export async function startPayment(row: ReservationRow): Promise<{ sessionId: string }> {
  const db = getServiceClient();
  const env = getSwinmoEnv();
  if (!db || !env) throw new Error("Paiement indisponible.");

  // Référence unique par tentative (Swinmo refuse une référence déjà liée à une charge en cours ou réussie).
  const reference = `${row.reference}-${randomBytes(3).toString("hex").toUpperCase()}`;
  const session = await createCheckoutSession({
    amount: row.package_price,
    currency: "XOF",
    reference,
    description: `OCD Live · ${row.package_name} · ${row.reference}`,
    country: XOF_COUNTRIES.includes(row.phone_country) ? row.phone_country : undefined,
    customer: { name: row.full_name, email: row.email ?? undefined, phone_number: row.phone_e164 },
    metadata: { reservation_id: row.id, reservation_reference: row.reference },
    expiresInMinutes: 60,
  });

  const { error } = await db.from("payments").insert({
    reservation_id: row.id,
    environment: env.environment,
    session_id: session.id,
    reference,
    status: "open",
    amount: row.package_price,
    currency: "XOF",
  });
  if (error) console.error("[payments.insert]", error.message);

  await logActivity({
    entityType: "reservation",
    entityId: row.id,
    action: "payment_started",
    message: `Paiement Mobile Money ouvert (${row.package_price.toLocaleString("fr-FR")} FCFA, ${env.environment === "test" ? "sandbox" : "réel"}).`,
    meta: { session_id: session.id, reference },
    actor: row.full_name,
  });
  return { sessionId: session.id };
}

export async function markPaymentExpired(id: string): Promise<void> {
  const db = getServiceClient();
  await db?.from("payments").update({ status: "expired" }).eq("id", id).in("status", ["open", "processing"]);
}

export type ApplyResult = "fulfilled" | "already" | "failed" | "processing" | "ignored" | "mismatch";

/**
 * Applique l'état d'une charge Swinmo (webhook, retour navigateur ou vérification admin).
 * Idempotent : la réservation n'est passée « Payée » et l'email envoyé qu'une seule fois.
 */
export async function applyCharge(charge: SwinmoCharge, source: "webhook" | "retour client" | "vérification admin"): Promise<ApplyResult> {
  const db = getServiceClient();
  if (!db) return "ignored";

  let query = db.from("payments").select("*");
  query = charge.checkout_session_id ? query.eq("session_id", charge.checkout_session_id) : query.eq("reference", charge.reference);
  const { data: payment } = await query.maybeSingle<PaymentRow>();
  if (!payment) return "ignored";

  // Contrôles d'intégrité exigés par Swinmo : montant, devise, référence.
  if (charge.reference !== payment.reference || charge.amount !== payment.amount || charge.currency !== payment.currency) {
    await logActivity({
      entityType: "reservation",
      entityId: payment.reservation_id,
      action: "payment_anomaly",
      message: `⚠️ Paiement incohérent ignoré (${charge.amount} ${charge.currency}, réf. ${charge.reference}).`,
      meta: { charge_id: charge.id, expected: { amount: payment.amount, currency: payment.currency, reference: payment.reference } },
    });
    return "mismatch";
  }

  const details = {
    charge_id: charge.id,
    fee: charge.fee ?? null,
    net: charge.net ?? null,
    operator: charge.payment_method?.operator ?? null,
    phone: charge.payment_method?.phone_number ?? null,
    failure_reason: charge.failure_reason ?? null,
    raw: charge,
  };

  if (charge.status === "processing") {
    await db.from("payments").update({ ...details, status: "processing" }).eq("id", payment.id).neq("status", "succeeded");
    return "processing";
  }

  if (charge.status === "failed") {
    const { data: changed } = await db
      .from("payments")
      .update({ ...details, status: "failed" })
      .eq("id", payment.id)
      .not("status", "in", "(succeeded,failed)")
      .select("id");
    if (changed?.length) {
      await logActivity({
        entityType: "reservation",
        entityId: payment.reservation_id,
        action: "payment_failed",
        message: `Paiement échoué${charge.failure_reason ? ` (${charge.failure_reason})` : ""} · ${source}.`,
        meta: { charge_id: charge.id },
      });
    }
    return "failed";
  }

  // succeeded : mise à jour conditionnelle = verrou contre le double traitement.
  const { data: won } = await db
    .from("payments")
    .update({ ...details, status: "succeeded", paid_at: charge.paid_at ?? new Date().toISOString() })
    .eq("id", payment.id)
    .neq("status", "succeeded")
    .select("id");
  if (!won?.length) return "already";

  const { data: reservation } = await db.from("reservations").select("*").eq("id", payment.reservation_id).single<ReservationRow>();
  const fee = charge.fee ? ` (frais ${charge.fee} ${charge.currency}, net ${charge.net} ${charge.currency})` : "";
  await logActivity({
    entityType: "reservation",
    entityId: payment.reservation_id,
    action: "payment_succeeded",
    message: `💳 Paiement reçu : ${charge.amount.toLocaleString("fr-FR")} ${charge.currency}${fee} via ${operatorLabel(charge.payment_method?.operator)} · ${source}.`,
    meta: { charge_id: charge.id },
    actor: "Swinmo Pay",
  });

  if (reservation && PAYABLE.has(reservation.status)) {
    await db.from("reservations").update({ status: "payee" }).eq("id", reservation.id);
    await logActivity({
      entityType: "reservation",
      entityId: reservation.id,
      action: "status_changed",
      message: `Statut : → Payée (automatique après paiement)`,
      meta: { from: reservation.status, to: "payee" },
      actor: "Swinmo Pay",
    });
    if (reservation.email) {
      await sendEmail({
        template: "reservation-payee",
        to: { email: reservation.email, name: reservation.full_name },
        content: reservationPaidEmail(toReservationView(rowToReservationLike(reservation))),
        entity: { type: "reservation", id: reservation.id },
      });
    }
  } else if (reservation) {
    // Payée alors que la réservation est annulée / absente : à traiter à la main (remboursement).
    await logActivity({
      entityType: "reservation",
      entityId: reservation.id,
      action: "payment_anomaly",
      message: `⚠️ Paiement reçu alors que la réservation est « ${reservation.status} » : vérifier et rembourser si besoin.`,
    });
  }
  return "fulfilled";
}
