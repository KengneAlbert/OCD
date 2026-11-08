/**
 * Couche d'abstraction des notifications (côté navigateur).
 *
 * NOTIFICATION_PROVIDER=whatsapp → ouvre WhatsApp avec le message pré-rempli (phase 1)
 * NOTIFICATION_PROVIDER=brevo    → POST /api/reservations → emails Brevo (phase 2)
 * NOTIFICATION_PROVIDER=both     → les deux
 *
 * ⚠️ Appeler sendReservation / sendCandidature directement dans un gestionnaire
 * de clic : WhatsApp est ouvert AVANT tout `await` pour ne pas être bloqué
 * par le navigateur.
 */
import { siteConfig } from "@/config/site";
import { buildCandidatureMessage, buildReservationMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Candidature, NotificationProvider, Reservation, SendResult } from "@/types";
import { clientProvider, usesEmail, usesWhatsApp } from "./provider";

export { clientProvider, usesEmail, usesWhatsApp };

interface SendOptions {
  provider?: NotificationProvider;
  /** Champ piège anti-spam (doit rester vide). */
  honeypot?: string;
}

function openWhatsApp(url: string): boolean {
  if (typeof window === "undefined") return false;
  const win = window.open(url, "_blank");
  if (!win) return false;
  win.opener = null;
  return true;
}

async function postJson(endpoint: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? { ok: true } : { ok: false, error: json.error ?? "L'envoi a échoué. Réessaie dans un instant." };
  } catch {
    return { ok: false, error: "Connexion impossible. Vérifie ta connexion internet et réessaie." };
  }
}

async function dispatch(
  message: string,
  endpoint: string,
  payload: unknown,
  { provider = clientProvider, honeypot = "" }: SendOptions,
): Promise<SendResult> {
  const result: SendResult = { ok: true };

  if (usesWhatsApp(provider)) {
    result.whatsappUrl = buildWhatsAppUrl(siteConfig.whatsappNumber, message);
    result.whatsappBlocked = !openWhatsApp(result.whatsappUrl);
  }

  if (usesEmail(provider)) {
    const res = await postJson(endpoint, { ...(payload as object), website: honeypot });
    result.emailed = res.ok;
    // En mode "both", WhatsApp reste le canal principal : l'échec email n'est pas bloquant.
    if (!res.ok && !result.whatsappUrl) return { ok: false, error: res.error };
  }

  return result;
}

export function sendReservation(reservation: Reservation, options: SendOptions = {}): Promise<SendResult> {
  return dispatch(buildReservationMessage(reservation), "/api/reservations", reservation, options);
}

export function sendCandidature(candidature: Candidature, options: SendOptions = {}): Promise<SendResult> {
  return dispatch(buildCandidatureMessage(candidature), "/api/candidatures", candidature, options);
}
