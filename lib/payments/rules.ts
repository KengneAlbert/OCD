/**
 * Règles PURES des paiements (testables sans base ni réseau) :
 * concordance d'une charge Swinmo avec la transaction attendue, calendrier des relances.
 */

export const CHARGE_ID_RE = /^ch_(test|live)_[\w-]{4,80}$/;

export interface ExpectedPayment {
  reference: string;
  amount: number;
  currency: string;
}

export interface ChargeFacts {
  reference: string;
  amount: number;
  currency: string;
}

export type ChargeCheck = { ok: true } | { ok: false; reason: "reference" | "currency" | "amount" };

/**
 * Une charge (relue chez Swinmo) correspond-elle à la transaction en base ?
 * - même référence et même devise ;
 * - montant payé ≥ montant attendu. Chez Swinmo le client paie exactement `amount` (frais à la
 *   charge du marchand) ; un montant supérieur est accepté. On compare toujours `amount`
 *   (devise de la session), jamais `payer_amount` (devise du payeur).
 * Pas de coupons dans OCD Live : aucun montant inférieur n'est acceptable.
 */
export function checkCharge(expected: ExpectedPayment, charge: ChargeFacts): ChargeCheck {
  if (charge.reference !== expected.reference) return { ok: false, reason: "reference" };
  if (charge.currency !== expected.currency) return { ok: false, reason: "currency" };
  if (!Number.isFinite(charge.amount) || charge.amount < expected.amount) return { ok: false, reason: "amount" };
  return { ok: true };
}

/* ─── Relances ─────────────────────────────────────────────────────────── */

export interface ReminderPlan {
  /** Délais depuis le début de la tentative (minutes), une relance par délai. */
  offsets: number[];
  /** Au-delà (minutes), plus aucune relance. */
  maxAgeMinutes: number;
}

const MIN = 1;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Réservations : 5 min (« termine ton paiement »), 1 h, 1 j, 3 j (« créneau libéré, réserve à nouveau »). */
export const RESERVATION_REMINDERS: ReminderPlan = { offsets: [5 * MIN, 1 * HOUR, 1 * DAY, 3 * DAY], maxAgeMinutes: 4 * DAY };

/** Abonnements : 5 min, 1 h, 1 j, 3 j, 7 j ; arrêt à 14 jours. */
export const SUBSCRIPTION_REMINDERS: ReminderPlan = { offsets: [5 * MIN, 1 * HOUR, 1 * DAY, 3 * DAY, 7 * DAY], maxAgeMinutes: 14 * DAY };

/**
 * Index de la relance à envoyer maintenant, ou null.
 * `sent` = relances déjà envoyées (stocké en base) : on n'envoie que la suivante, jamais deux fois la même.
 * Si plusieurs échéances sont passées (tâche arrêtée un moment), on envoie seulement la plus récente
 * et on saute les autres (`skipTo`).
 */
export function dueReminder(startedAt: Date, sent: number, now: Date, plan: ReminderPlan): { index: number; skipTo: number } | null {
  const age = (now.getTime() - startedAt.getTime()) / 60_000;
  if (age < 0 || age > plan.maxAgeMinutes) return null;
  let latest = -1;
  plan.offsets.forEach((offset, i) => {
    if (age >= offset) latest = i;
  });
  if (latest < sent) return null;
  return { index: latest, skipTo: latest + 1 };
}
