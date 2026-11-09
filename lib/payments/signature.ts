import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Vérifie l'en-tête X-Swinmo-Signature (t=<timestamp>,v1=<hmac hex>) :
 * HMAC-SHA256 de "<timestamp>.<corps brut>", comparaison à temps constant,
 * rejet au-delà de 5 minutes (anti-rejeu).
 */
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string, nowSeconds = Date.now() / 1000): boolean {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v1;
  if (!Number.isFinite(timestamp) || !signature) return false;
  if (Math.abs(nowSeconds - timestamp) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
