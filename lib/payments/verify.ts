import "server-only";
import { applySubscriptionCharge, SUBSCRIPTION_REF_PREFIX } from "@/lib/db/lives";
import { applyCharge, type ApplyResult } from "@/lib/db/payments";
import { logActivity } from "@/lib/db/activity";
import { getServiceClient } from "@/lib/supabase/admin";
import { CHARGE_ID_RE } from "./rules";
import { getCharge, getSwinmoEnv, SwinmoError, type SwinmoCharge } from "./swinmo";

export type VerifySource = "webhook" | "retour client" | "vérification admin" | "rapprochement";

export type VerifyOutcome =
  | { ok: true; charge: SwinmoCharge; result: ApplyResult }
  | { ok: false; reason: "invalid_id" | "not_found" | "environment" | "forbidden" | "reference" | "unavailable" };

/**
 * SEULE porte d'entrée pour appliquer un paiement (webhook, retour navigateur, admin, tâche de rapprochement).
 *
 * 1. Relit la charge chez Swinmo (GET /v1/charges/:id, clé secrète) : seules ces données font foi,
 *    jamais le corps d'un webhook ni ce qu'envoie le navigateur.
 * 2. Vérifie l'environnement (test / live) et, si fourni, une règle d'appartenance (`authorize`)
 *    ou la référence annoncée par le webhook (`expectReference`).
 * 3. Applique la charge (réservation « OCD-… » ou abonnement « ABO-… ») : concordance référence /
 *    devise / montant ≥ attendu, idempotence, transitions de statut à sens unique.
 */
export async function verifyTransactionWithProvider(
  chargeId: string,
  source: VerifySource,
  opts: { authorize?: (charge: SwinmoCharge) => boolean | Promise<boolean>; expectReference?: string } = {},
): Promise<VerifyOutcome> {
  if (!CHARGE_ID_RE.test(chargeId)) return { ok: false, reason: "invalid_id" };
  const env = getSwinmoEnv();
  if (!env) return { ok: false, reason: "unavailable" };

  let charge: SwinmoCharge;
  try {
    charge = await getCharge(chargeId);
  } catch (e) {
    if (e instanceof SwinmoError && e.status === 404) {
      await logActivity({ entityType: "system", action: "payment_anomaly", message: `⚠️ Charge inconnue chez Swinmo (${chargeId}) · ${source}.` });
      return { ok: false, reason: "not_found" };
    }
    throw e;
  }

  if (charge.environment && charge.environment !== env.environment) return { ok: false, reason: "environment" };
  if (opts.expectReference !== undefined && charge.reference !== opts.expectReference) {
    await logActivity({
      entityType: "system",
      action: "payment_anomaly",
      message: `⚠️ Webhook incohérent : référence annoncée ${opts.expectReference}, référence réelle ${charge.reference} (${chargeId}).`,
    });
    return { ok: false, reason: "reference" };
  }
  if (opts.authorize && !(await opts.authorize(charge))) return { ok: false, reason: "forbidden" };

  const result = charge.reference.startsWith(SUBSCRIPTION_REF_PREFIX) ? await applySubscriptionCharge(charge, source) : await applyCharge(charge, source);
  return { ok: true, charge, result };
}

/** La référence a-t-elle été créée par NOTRE système (tentative enregistrée en base) ? */
export async function isKnownReference(reference: unknown): Promise<boolean> {
  if (typeof reference !== "string" || reference.length > 80) return false;
  const db = getServiceClient();
  if (!db) return false;
  const table = reference.startsWith(SUBSCRIPTION_REF_PREFIX) ? "subscription_payments" : "payments";
  const { data } = await db.from(table).select("id").eq("reference", reference).maybeSingle();
  return Boolean(data);
}
