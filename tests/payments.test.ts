import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "@/lib/payments/signature";

const secret = "whsec_test";
const body = JSON.stringify({ id: "evt_1", event: "charge.succeeded", data: { id: "ch_test_1", amount: 50000 } });
const sign = (t: number, b = body, s = secret) => `t=${t},v1=${createHmac("sha256", s).update(`${t}.${b}`).digest("hex")}`;

describe("signature des webhooks Swinmo", () => {
  const now = 1_800_000_000;

  it("accepte une signature valide et récente", () => {
    expect(verifyWebhookSignature(body, sign(now - 10), secret, now)).toBe(true);
  });

  it("refuse un corps modifié", () => {
    expect(verifyWebhookSignature(body.replace("50000", "100"), sign(now), secret, now)).toBe(false);
  });

  it("refuse un mauvais secret, un en-tête absent ou mal formé", () => {
    expect(verifyWebhookSignature(body, sign(now, body, "autre"), secret, now)).toBe(false);
    expect(verifyWebhookSignature(body, null, secret, now)).toBe(false);
    expect(verifyWebhookSignature(body, "v1=abc", secret, now)).toBe(false);
    expect(verifyWebhookSignature(body, sign(now), "", now)).toBe(false);
  });

  it("refuse un événement de plus de 5 minutes (rejeu)", () => {
    expect(verifyWebhookSignature(body, sign(now - 301), secret, now)).toBe(false);
  });
});
