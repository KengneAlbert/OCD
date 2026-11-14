/**
 * Sécurité du module de paiement (Swinmo Pay).
 * Swinmo, l'envoi d'emails et l'authentification sont simulés ; la base est un faux client
 * Supabase en mémoire (tests/helpers/fake-db.ts) qui reproduit les mises à jour conditionnelles.
 */
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "./helpers/fake-db";

const SECRET = "whsec_test_secret";

const swinmo = vi.hoisted(() => ({ getCharge: vi.fn(), getSession: vi.fn(), findChargeByReference: vi.fn() }));
const email = vi.hoisted(() => ({ send: vi.fn(async () => ({ ok: true })) }));
const auth = vi.hoisted(() => ({ user: null as null | { id: string; email: string } }));

vi.mock("@/lib/supabase/admin", async () => {
  const { fakeDb: db } = await import("./helpers/fake-db");
  return { getServiceClient: () => db };
});
vi.mock("@/lib/payments/swinmo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/swinmo")>();
  return {
    ...actual,
    getCharge: swinmo.getCharge,
    getSession: swinmo.getSession,
    findChargeByReference: swinmo.findChargeByReference,
    getSwinmoEnv: () => ({ secretKey: "sk_test_x", webhookSecret: SECRET, environment: "test" as const }),
    isPaymentEnabled: () => true,
  };
});
vi.mock("@/lib/emails/send", () => ({ sendEmail: email.send, getBrevoEnv: () => null }));
vi.mock("@/lib/supabase/server", () => ({ getAuthClient: async () => ({ auth: { getUser: async () => ({ data: { user: auth.user } }) } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn(), unstable_cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/db/holds", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/db/holds")>()), releaseExpiredHolds: async () => {} }));

const { POST: webhook } = await import("@/app/api/payments/webhook/route");
const { POST: confirm } = await import("@/app/api/payments/confirm/route");
const { checkCharge, dueReminder, RESERVATION_REMINDERS, SUBSCRIPTION_REMINDERS } = await import("@/lib/payments/rules");
const { runPaymentsJob } = await import("@/lib/jobs/payments");
const { submitLiveAction } = await import("@/lib/espace/actions");
const { saveProductAction } = await import("@/lib/marketplace/actions");

/* ─── Données ──────────────────────────────────────────────────────────── */

const MIN = 60_000;
const ago = (ms: number, now = Date.now()) => new Date(now - ms).toISOString();

function reservation(over: Record<string, unknown> = {}) {
  return {
    id: "res-1",
    reference: "OCD-ABC123",
    status: "nouvelle",
    live_type: "presentiel",
    live_date: "2026-12-10",
    slot_start: "10:00",
    slot_end: "11:30",
    package_id: "decouverte",
    package_name: "Live Découverte",
    package_price: 10000,
    full_name: "Ama Mensah",
    business_name: "Ama Wax",
    category: "mode",
    category_other: null,
    product_description: "Pagnes",
    product_count: null,
    phone_country: "TG",
    phone_number: "90112233",
    phone_e164: "+22890112233",
    email: "ama@example.com",
    country: null,
    city: null,
    shop_address: null,
    tiktok: null,
    facebook: null,
    instagram: null,
    special_needs: null,
    visitor_timezone: null,
    channel: "site",
    admin_notes: null,
    pay_token: "a".repeat(36),
    reminder_count: 0,
    created_at: ago(2 * MIN),
    updated_at: ago(2 * MIN),
    ...over,
  };
}

function payment(over: Record<string, unknown> = {}) {
  return {
    id: "pay-1",
    reservation_id: "res-1",
    environment: "test",
    session_id: "cs_test_1",
    charge_id: null,
    reference: "OCD-ABC123-A1B2C3",
    status: "open",
    amount: 10000,
    currency: "XOF",
    reminder_count: 0,
    created_at: ago(1 * MIN),
    ...over,
  };
}

function charge(over: Record<string, unknown> = {}) {
  return {
    id: "ch_test_abcd1234",
    object: "charge",
    environment: "test",
    status: "succeeded",
    amount: 10000,
    currency: "XOF",
    fee: 250,
    net: 9750,
    reference: "OCD-ABC123-A1B2C3",
    checkout_session_id: "cs_test_1",
    payment_method: { type: "mobile_money", operator: "TOGOCOM", phone_number: "+22890112233" },
    paid_at: new Date().toISOString(),
    ...over,
  };
}

function signedWebhook(body: unknown, opts: { signature?: string | null; secret?: string } = {}) {
  const raw = JSON.stringify(body);
  const t = Math.floor(Date.now() / 1000);
  const sig = `t=${t},v1=${createHmac("sha256", opts.secret ?? SECRET).update(`${t}.${raw}`).digest("hex")}`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  const value = opts.signature === undefined ? sig : opts.signature;
  if (value !== null) headers["x-swinmo-signature"] = value;
  return new Request("http://localhost/api/payments/webhook", { method: "POST", headers, body: raw });
}

const event = (c: Record<string, unknown>, type = "charge.succeeded") => ({ id: "evt_1", event: type, environment: "test", created_at: Date.now(), data: c });
const res = () => fakeDb.rows("reservations")[0]!;
const pay = () => fakeDb.rows("payments")[0]!;
const sentTemplates = () => email.send.mock.calls.map((c) => (c as unknown as [{ template: string }])[0].template);

beforeEach(() => {
  fakeDb.reset();
  vi.clearAllMocks();
  auth.user = null;
  fakeDb.rows("reservations").push(reservation());
  fakeDb.rows("payments").push(payment());
});

/* ─── 1-3. Webhook ─────────────────────────────────────────────────────── */

describe("webhook Swinmo", () => {
  it("1. rejette une signature invalide ou absente, sans rien appeler", async () => {
    const r1 = await webhook(signedWebhook(event(charge()), { secret: "mauvais-secret" }));
    const r2 = await webhook(signedWebhook(event(charge()), { signature: null }));
    const r3 = await webhook(signedWebhook(event(charge()), { signature: "t=1,v1=abc" }));
    expect([r1.status, r2.status, r3.status]).toEqual([400, 400, 400]);
    expect(swinmo.getCharge).not.toHaveBeenCalled();
    expect(res().status).toBe("nouvelle");
  });

  it("2. rejette un identifiant de transaction inconnu de notre base", async () => {
    const r = await webhook(signedWebhook(event(charge({ reference: "OCD-INCONNU-ZZZZZZ" }))));
    expect(r.status).toBe(404);
    expect(swinmo.getCharge).not.toHaveBeenCalled();
    expect(res().status).toBe("nouvelle");
    expect(fakeDb.rows("activity_log").some((l) => String(l.message).includes("référence inconnue"))).toBe(true);
  });

  it("3. webhook falsifié (corps « succeeded », Swinmo dit « failed ») : rien n'est crédité", async () => {
    swinmo.getCharge.mockResolvedValue(charge({ status: "failed", failure_reason: "insufficient_funds" }));
    const r = await webhook(signedWebhook(event(charge({ status: "succeeded" }))));
    expect(r.status).toBe(200);
    expect(swinmo.getCharge).toHaveBeenCalledWith("ch_test_abcd1234");
    expect(res().status).toBe("nouvelle");
    expect(pay().status).toBe("failed");
    expect(sentTemplates()).not.toContain("reservation-payee");
  });

  it("3 bis. référence annoncée différente de la référence réelle chez Swinmo : rejet", async () => {
    swinmo.getCharge.mockResolvedValue(charge({ reference: "OCD-AUTRE-999999" }));
    await webhook(signedWebhook(event(charge())));
    expect(res().status).toBe("nouvelle");
    expect(pay().status).toBe("open");
  });
});

/* ─── 4-6. Montants ────────────────────────────────────────────────────── */

describe("montants", () => {
  it("4. montant inférieur (pas de coupon) → amount_mismatch, aucun accès", async () => {
    swinmo.getCharge.mockResolvedValue(charge({ amount: 5000 }));
    await webhook(signedWebhook(event(charge())));
    expect(pay().status).toBe("amount_mismatch");
    expect(pay().paid_amount).toBe(5000);
    expect(res().status).toBe("nouvelle");
    expect(fakeDb.rows("activity_log").some((l) => l.action === "payment_anomaly")).toBe(true);
  });

  it.skip("5. montant inférieur avec coupon valide → accepté (sans objet : OCD Live n'a pas de coupons)", () => {});

  it("5 bis. sans coupons, la règle refuse tout montant inférieur, même d'1 FCFA", () => {
    expect(checkCharge({ reference: "R", amount: 10000, currency: "XOF" }, { reference: "R", amount: 9999, currency: "XOF" })).toEqual({ ok: false, reason: "amount" });
  });

  it("6. montant supérieur (frais inclus) → accepté", async () => {
    swinmo.getCharge.mockResolvedValue(charge({ amount: 10250 }));
    await webhook(signedWebhook(event(charge())));
    expect(pay().status).toBe("succeeded");
    expect(res().status).toBe("payee");
  });

  it("6 bis. mauvaise devise → refusée", () => {
    expect(checkCharge({ reference: "R", amount: 10000, currency: "XOF" }, { reference: "R", amount: 10000, currency: "XAF" })).toEqual({ ok: false, reason: "currency" });
  });
});

/* ─── 7. Idempotence ───────────────────────────────────────────────────── */

describe("idempotence", () => {
  it("7. le même webhook reçu deux fois ne crédite qu'une fois", async () => {
    swinmo.getCharge.mockResolvedValue(charge());
    await webhook(signedWebhook(event(charge())));
    await webhook(signedWebhook(event(charge())));
    expect(res().status).toBe("payee");
    expect(fakeDb.rows("activity_log").filter((l) => l.action === "payment_succeeded")).toHaveLength(1);
    expect(sentTemplates().filter((t) => t === "reservation-payee")).toHaveLength(1);
  });

  it("7 bis. un paiement réussi ne peut pas repasser en échec", async () => {
    swinmo.getCharge.mockResolvedValueOnce(charge()).mockResolvedValueOnce(charge({ status: "failed" }));
    await webhook(signedWebhook(event(charge())));
    await webhook(signedWebhook(event(charge(), "charge.failed")));
    expect(pay().status).toBe("succeeded");
    expect(res().status).toBe("payee");
  });
});

/* ─── 8. Retour navigateur ─────────────────────────────────────────────── */

describe("retour navigateur", () => {
  const confirmReq = (chargeId: string) =>
    new Request("http://localhost/api/payments/confirm", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 200)}` },
      body: JSON.stringify({ token: "a".repeat(36), chargeId }),
    });

  it("8. le navigateur seul n'active jamais l'accès : seule la réponse de Swinmo compte", async () => {
    swinmo.getCharge.mockResolvedValue(charge({ status: "processing" }));
    const r = await confirm(confirmReq("ch_test_abcd1234"));
    expect(r.status).toBe(200);
    expect(res().status).toBe("nouvelle");
    expect(pay().status).toBe("processing");
  });

  it("8 bis. une charge d'une autre réservation est refusée", async () => {
    swinmo.getCharge.mockResolvedValue(charge({ reference: "OCD-ZZZ999-AAAAAA" }));
    const r = await confirm(confirmReq("ch_test_abcd1234"));
    expect(r.status).toBe(400);
    expect(res().status).toBe("nouvelle");
  });
});

/* ─── 9. Fonctionnalités payantes ──────────────────────────────────────── */

describe("fonctionnalités payantes", () => {
  beforeEach(() => {
    auth.user = { id: "sub-1", email: "kofi@example.com" };
    fakeDb.rows("subscribers").push({
      id: "sub-1",
      email: "kofi@example.com",
      full_name: "Kofi",
      business_name: "Kofi Shop",
      country: "TG",
      category: "mode",
      tiktok_handle: "kofi.shop",
      status: "actif",
      paid_until: null,
    });
  });

  it("9. sans abonnement payé : pas de live dans l'annuaire", async () => {
    const out = await submitLiveAction({}, new FormData());
    expect(out.ok).toBe(false);
    expect(out.message).toMatch(/Renouvelle/);
    expect(fakeDb.rows("live_submissions")).toHaveLength(0);
  });

  it("9 bis. sans abonnement payé : pas de produit sur la marketplace", async () => {
    const out = await saveProductAction({}, new FormData());
    expect(out.ok).toBe(false);
    expect(out.message).toMatch(/abonnement/);
    expect(fakeDb.rows("products")).toHaveLength(0);
  });

  it("9 ter. abonnement expiré : refusé aussi", async () => {
    fakeDb.rows("subscribers")[0]!.paid_until = ago(MIN);
    const out = await submitLiveAction({}, new FormData());
    expect(out.ok).toBe(false);
  });
});

/* ─── 10. Relances ─────────────────────────────────────────────────────── */

describe("relances", () => {
  it("10. calendrier des réservations : 5 min, 1 h, 1 j, 3 j, puis plus rien", () => {
    const start = new Date("2026-12-01T10:00:00Z");
    const at = (min: number) => new Date(start.getTime() + min * MIN);
    expect(dueReminder(start, 0, at(4), RESERVATION_REMINDERS)).toBeNull();
    expect(dueReminder(start, 0, at(5), RESERVATION_REMINDERS)).toEqual({ index: 0, skipTo: 1 });
    expect(dueReminder(start, 1, at(30), RESERVATION_REMINDERS)).toBeNull();
    expect(dueReminder(start, 1, at(60), RESERVATION_REMINDERS)).toEqual({ index: 1, skipTo: 2 });
    expect(dueReminder(start, 2, at(24 * 60), RESERVATION_REMINDERS)).toEqual({ index: 2, skipTo: 3 });
    expect(dueReminder(start, 3, at(3 * 24 * 60), RESERVATION_REMINDERS)).toEqual({ index: 3, skipTo: 4 });
    expect(dueReminder(start, 4, at(3 * 24 * 60 + 1), RESERVATION_REMINDERS)).toBeNull();
    expect(dueReminder(start, 0, at(5 * 24 * 60), RESERVATION_REMINDERS)).toBeNull(); // délai max dépassé
    // Tâche arrêtée un moment : une seule relance, la plus récente.
    expect(dueReminder(start, 0, at(2 * 24 * 60), RESERVATION_REMINDERS)).toEqual({ index: 2, skipTo: 3 });
  });

  it("10 bis. calendrier des abonnements : 5 min → 7 j, arrêt à 14 j", () => {
    const start = new Date("2026-12-01T10:00:00Z");
    const at = (days: number) => new Date(start.getTime() + days * 24 * 60 * MIN);
    expect(dueReminder(start, 4, at(7), SUBSCRIPTION_REMINDERS)).toEqual({ index: 4, skipTo: 5 });
    expect(dueReminder(start, 5, at(10), SUBSCRIPTION_REMINDERS)).toBeNull();
    expect(dueReminder(start, 0, at(15), SUBSCRIPTION_REMINDERS)).toBeNull();
  });

  it("10 ter. la tâche envoie chaque relance une seule fois et s'arrête dès que c'est payé", async () => {
    const now = Date.now();
    fakeDb.reset();
    fakeDb.rows("reservations").push(reservation({ created_at: ago(6 * MIN, now) }));

    await runPaymentsJob(new Date(now));
    await runPaymentsJob(new Date(now)); // deuxième passage : pas de doublon
    expect(sentTemplates()).toEqual(["paiement-relance"]);
    expect(res().reminder_count).toBe(1);

    res().status = "expiree"; // créneau libéré
    await runPaymentsJob(new Date(now + 60 * MIN));
    expect(sentTemplates()).toEqual(["paiement-relance", "paiement-relance"]);

    // Payé entre-temps : plus aucune relance.
    fakeDb.rows("payments").push(payment({ status: "succeeded", created_at: ago(MIN, now) }));
    await runPaymentsJob(new Date(now + 25 * 60 * MIN));
    expect(sentTemplates()).toHaveLength(2);
    expect(res().reminder_count).toBe(RESERVATION_REMINDERS.offsets.length);
  });

  it("10 quater. abonnement : relancé tant qu'il n'est pas payé, arrêt dès qu'il est actif", async () => {
    const now = Date.now();
    fakeDb.reset();
    fakeDb.rows("subscribers").push({ id: "sub-1", email: "kofi@example.com", full_name: "Kofi T", status: "actif", paid_until: null });
    fakeDb.rows("subscription_payments").push({ id: "sp-1", subscriber_id: "sub-1", reference: "ABO-1", status: "failed", amount: 5000, currency: "XOF", reminder_count: 0, created_at: ago(10 * MIN, now) });

    await runPaymentsJob(new Date(now));
    expect(sentTemplates()).toEqual(["abonnement-relance"]);

    fakeDb.rows("subscribers")[0]!.paid_until = new Date(now + 30 * 24 * 60 * MIN).toISOString(); // payé ailleurs
    await runPaymentsJob(new Date(now + 2 * 60 * MIN));
    expect(sentTemplates()).toEqual(["abonnement-relance"]);
  });
});

/* ─── Rapprochement ────────────────────────────────────────────────────── */

describe("rapprochement (webhook perdu)", () => {
  it("crédite un paiement réussi dont le webhook n'est jamais arrivé", async () => {
    swinmo.getSession.mockResolvedValue({ id: "cs_test_1", status: "succeeded", charge_id: "ch_test_abcd1234" });
    swinmo.getCharge.mockResolvedValue(charge());
    const out = await runPaymentsJob();
    expect(out.reconciled).toBe(1);
    expect(res().status).toBe("payee");
    expect(pay().verified_at).toBeTruthy();
  });

  it("marque « expired » une session expirée sans paiement", async () => {
    swinmo.getSession.mockResolvedValue({ id: "cs_test_1", status: "expired", charge_id: null });
    const out = await runPaymentsJob();
    expect(out.expired).toBe(1);
    expect(pay().status).toBe("expired");
    expect(res().status).toBe("nouvelle");
  });
});
