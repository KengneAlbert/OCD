/**
 * Couche d'abstraction des notifications (côté navigateur).
 *
 * Les réservations partent uniquement par email (RESERVATION_PROVIDER = brevo).
 * Chaque réservation / candidature est TOUJOURS envoyée à l'API, qui
 * l'enregistre dans Supabase (si configuré) et envoie les emails Brevo
 * selon NOTIFICATION_PROVIDER :
 *   whatsapp → ouvre WhatsApp avec le message pré-rempli (phase 1)
 *   brevo    → emails Brevo uniquement (phase 2)
 *   both     → les deux
 *
 * ⚠️ Appeler sendReservation / sendCandidature directement dans un gestionnaire
 * de clic : l'onglet WhatsApp est ouvert AVANT le premier `await` (sinon le
 * navigateur le bloque), puis redirigé vers wa.me une fois l'API d'accord.
 */
import { siteConfig } from "@/config/site";
import { buildCandidatureMessage, buildReservationMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Candidature, NotificationProvider, Reservation, SendResult } from "@/types";
import { clientProvider, RESERVATION_PROVIDER, usesEmail, usesWhatsApp } from "./provider";

export { clientProvider, RESERVATION_PROVIDER, usesEmail, usesWhatsApp };

interface SendOptions {
  provider?: NotificationProvider;
  /** Champ piège anti-spam (doit rester vide). */
  honeypot?: string;
}

interface PostResult {
  ok: boolean;
  status: number;
  error?: string;
  emailed?: boolean;
  payUrl?: string;
}

async function postJson(endpoint: string, body: unknown): Promise<PostResult> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string; emailed?: boolean; payUrl?: string };
    return {
      ok: res.ok,
      status: res.status,
      emailed: json.emailed,
      payUrl: typeof json.payUrl === "string" && json.payUrl.startsWith("http") ? json.payUrl : undefined,
      error: res.ok ? undefined : (json.error ?? "L'envoi a échoué. Réessaie dans un instant."),
    };
  } catch {
    return { ok: false, status: 0, error: "Connexion impossible. Vérifie ta connexion internet et réessaie." };
  }
}

/** Ouvre un onglet vide tout de suite (geste utilisateur) pour pouvoir y charger WhatsApp ensuite. */
function preopenTab(): Window | null {
  if (typeof window === "undefined") return null;
  const win = window.open("about:blank", "_blank");
  if (win) win.opener = null;
  return win;
}

async function dispatch(
  message: string,
  endpoint: string,
  payload: unknown,
  { provider = clientProvider, honeypot = "" }: SendOptions,
): Promise<SendResult> {
  const whatsapp = usesWhatsApp(provider);
  const tab = whatsapp ? preopenTab() : null;

  const res = await postJson(endpoint, {
    ...(payload as object),
    website: honeypot,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Erreur « métier » (créneau pris, données refusées, trop de demandes) : on arrête tout.
  const blocking = !res.ok && (res.status === 409 || res.status === 422 || res.status === 429);
  if (blocking || (!whatsapp && !res.ok)) {
    tab?.close();
    return { ok: false, error: res.error };
  }

  const result: SendResult = { ok: true, emailed: res.emailed, payUrl: res.payUrl };
  if (whatsapp) {
    // Panne réseau / serveur en mode WhatsApp : la demande part quand même par WhatsApp.
    result.whatsappUrl = buildWhatsAppUrl(siteConfig.whatsappNumber, message);
    if (tab && !tab.closed) {
      tab.location.href = result.whatsappUrl;
      result.whatsappBlocked = false;
    } else {
      result.whatsappBlocked = true;
    }
  }
  return result;
}

export function sendReservation(reservation: Reservation, options: SendOptions = {}): Promise<SendResult> {
  return dispatch(buildReservationMessage(reservation), "/api/reservations", reservation, { provider: RESERVATION_PROVIDER, ...options });
}

export function sendCandidature(candidature: Candidature, options: SendOptions = {}): Promise<SendResult> {
  return dispatch(buildCandidatureMessage(candidature), "/api/candidatures", candidature, options);
}
