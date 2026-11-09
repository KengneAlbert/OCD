import "server-only";
/**
 * Client minimal de l'API Swinmo Pay v1 (https://pay.swinmo.shop/docs).
 * Clé secrète uniquement côté serveur : sk_test_… (sandbox) ou sk_live_… (production).
 */
import { randomUUID } from "node:crypto";

export { verifyWebhookSignature } from "./signature";

const BASE_URL = "https://pay.swinmo.shop";

export function getSwinmoEnv() {
  const secretKey = process.env.SWINMO_SECRET_KEY;
  if (!secretKey) return null;
  return {
    secretKey,
    webhookSecret: process.env.SWINMO_WEBHOOK_SECRET ?? "",
    environment: secretKey.startsWith("sk_live_") ? ("live" as const) : ("test" as const),
  };
}

export const isPaymentEnabled = () => getSwinmoEnv() !== null;

export type ChargeStatus = "processing" | "succeeded" | "failed";

export interface SwinmoCharge {
  id: string;
  object: "charge";
  environment: "test" | "live";
  status: ChargeStatus;
  amount: number;
  currency: string;
  payer_amount?: number;
  payer_currency?: string;
  fee?: number;
  net?: number;
  reference: string;
  payment_method?: { type: string; phone_number?: string; country?: string; operator?: string };
  failure_reason?: string | null;
  metadata?: Record<string, unknown> | null;
  checkout_session_id?: string | null;
  paid_at?: string | null;
}

export interface SwinmoSession {
  id: string;
  object: "checkout.session";
  status: "open" | "processing" | "succeeded" | "failed" | "expired";
  amount: number;
  currency: string;
  reference: string;
  charge_id?: string | null;
  expires_at: string;
}

export class SwinmoError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
  const env = getSwinmoEnv();
  if (!env) throw new SwinmoError("Paiement non configuré (SWINMO_SECRET_KEY).", 503, "not_configured");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.secretKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string };
  if (!res.ok) throw new SwinmoError(json.error ?? `Swinmo ${res.status}`, res.status, json.code);
  return json;
}

export interface CreateSessionInput {
  amount: number;
  reference: string;
  currency?: string;
  description?: string;
  country?: string;
  customer?: { name?: string; email?: string; phone_number?: string };
  metadata?: Record<string, string>;
  expiresInMinutes?: number;
}

/** POST /v1/checkout/sessions : seul `id` doit être transmis au navigateur. */
export function createCheckoutSession(input: CreateSessionInput): Promise<SwinmoSession> {
  return request<SwinmoSession>("/v1/checkout/sessions", {
    method: "POST",
    idempotencyKey: randomUUID(),
    body: JSON.stringify({
      amount: input.amount,
      reference: input.reference,
      currency: input.currency ?? "XOF",
      description: input.description,
      country: input.country,
      customer: input.customer,
      metadata: input.metadata,
      expires_in_minutes: input.expiresInMinutes ?? 60,
    }),
  });
}

/** GET /v1/checkout/sessions/:id : lisible avec le seul identifiant de session (donne charge_id et l'expiration). */
export async function getSession(id: string): Promise<SwinmoSession> {
  const res = await fetch(`${BASE_URL}/v1/checkout/sessions/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => ({}))) as SwinmoSession & { error?: string; code?: string };
  if (!res.ok) throw new SwinmoError(json.error ?? `Swinmo ${res.status}`, res.status, json.code);
  return json;
}

/** GET /v1/charges/:id : source de vérité pour confirmer un paiement. */
export function getCharge(id: string): Promise<SwinmoCharge> {
  return request<SwinmoCharge>(`/v1/charges/${encodeURIComponent(id)}`);
}

/** Cherche la charge d'une référence parmi les plus récentes (rattrapage d'un webhook manqué). */
export async function findChargeByReference(reference: string, pages = 3): Promise<SwinmoCharge | null> {
  let startingAfter: string | undefined;
  for (let i = 0; i < pages; i++) {
    const qs = new URLSearchParams({ limit: "100", ...(startingAfter ? { starting_after: startingAfter } : {}) });
    const list = await request<{ data: SwinmoCharge[]; has_more: boolean }>(`/v1/charges?${qs}`);
    const matches = list.data.filter((c) => c.reference === reference);
    const best = matches.find((c) => c.status === "succeeded") ?? matches.find((c) => c.status === "processing") ?? matches[0];
    if (best) return best;
    if (!list.has_more || list.data.length === 0) break;
    startingAfter = list.data[list.data.length - 1]!.id;
  }
  return null;
}

/** Nom commercial des opérateurs (clés Swinmo → libellé affiché). */
const OPERATOR_LABELS: Record<string, string> = {
  TOGOCOM: "T-Money",
  MOOV: "Moov Money",
  MTN: "MTN Mobile Money",
  ORANGE: "Orange Money",
  WAVE: "Wave",
  AIRTEL: "Airtel Money",
  CELTIIS: "Celtiis Cash",
  DJAMO: "Djamo",
  MPESA: "M-Pesa",
  FREE: "Free Money",
  EXPRESSO: "Expresso",
  TELECEL: "Telecel Cash",
  AIRTELTIGO: "AirtelTigo Money",
  MOBICASH: "Mobi Cash",
  WIZALL: "Wizall Money",
  AFRIMONEY: "Afrimoney",
  TIGO: "Tigo Pesa",
  HALOPESA: "HaloPesa",
  EZYPESA: "EzyPesa",
  TTCL: "TTCL",
  VODACOM: "Vodacom M-Pesa",
  CARD: "Carte bancaire",
};
export const operatorLabel = (key?: string | null) => (key ? (OPERATOR_LABELS[key.toUpperCase()] ?? key) : "Mobile Money");

/** Pays dont la devise est le franc CFA BCEAO (XOF), devise des prix OCD Live. */
export const XOF_COUNTRIES = ["TG", "BJ", "BF", "CI", "ML", "SN", "NE"];
