import "server-only";
/**
 * Provider Brevo (phase 2) — DÉSACTIVÉ tant que NOTIFICATION_PROVIDER=whatsapp.
 * Appelé uniquement depuis les Route Handlers /api/reservations et /api/candidatures.
 * API : https://developers.brevo.com/reference/sendtransacemail
 */
import { getPackage } from "@/config/packages";
import { siteConfig } from "@/config/site";
import { formatDateFr, formatSlotFr } from "@/lib/schedule";
import { formatPrice } from "@/lib/utils";
import { buildCandidatureMessage, buildReservationMessage, formatLiveType, formatPhone } from "@/lib/whatsapp";
import type { Candidature, Reservation } from "@/types";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

interface BrevoEnv {
  apiKey: string;
  senderEmail: string;
  teamEmail: string;
}

export function getBrevoEnv(): BrevoEnv | null {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const teamEmail = process.env.OCD_TEAM_EMAIL;
  if (!apiKey || !senderEmail || !teamEmail) return null;
  return { apiKey, senderEmail, teamEmail };
}

interface EmailPayload {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  text: string;
  replyTo?: { email: string; name?: string };
}

async function sendEmail(env: BrevoEnv, email: EmailPayload): Promise<void> {
  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: { "api-key": env.apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: siteConfig.name, email: env.senderEmail },
      to: email.to,
      replyTo: email.replyTo,
      subject: email.subject,
      htmlContent: email.html,
      textContent: email.text,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status} : ${detail.slice(0, 300)}`);
  }
}

/* ─── Gabarits ─────────────────────────────────────────────────────────── */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#FAF7F2;font-family:Arial,Helvetica,sans-serif;color:#111">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:20px;box-shadow:0 10px 40px -12px #FFD9A0" cellpadding="0" cellspacing="0">
  <tr><td style="padding:28px 28px 8px"><span style="font-size:26px;font-weight:800;color:#E8792B">OCD</span> <span style="font-size:22px;font-weight:800">Live</span></td></tr>
  <tr><td style="padding:8px 28px 28px"><h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>${body}</td></tr>
  <tr><td style="padding:16px 28px;border-top:1px solid #ECE6DD;font-size:12px;color:#66615C">OCD Live — Lomé, Togo · ${escapeHtml(siteConfig.url)}</td></tr>
  </table></td></tr></table></body></html>`;
}

function rows(entries: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="font-size:14px">${entries
    .map(
      ([k, v]) =>
        `<tr><td style="color:#66615C;vertical-align:top;width:40%">${escapeHtml(k)}</td><td style="font-weight:600">${escapeHtml(v || "—")}</td></tr>`,
    )
    .join("")}</table>`;
}

function reservationRows(r: Reservation): [string, string][] {
  const pkg = getPackage(r.packageId);
  return [
    ["Référence", r.reference],
    ["Type de live", formatLiveType(r)],
    ["Date", formatDateFr(r.date)],
    ["Créneau", `${formatSlotFr(r.slotStart, r.slotEnd)} (heure de Lomé)`],
    ["Package", pkg ? `${pkg.name} — ${formatPrice(pkg.price)}` : r.packageId],
    ["Business", r.info.businessName],
  ];
}

/* ─── Envois ───────────────────────────────────────────────────────────── */

export async function sendReservationEmails(reservation: Reservation, env: BrevoEnv): Promise<void> {
  const { info } = reservation;
  const teamText = buildReservationMessage(reservation).replace(/\*/g, "");

  const team = sendEmail(env, {
    to: [{ email: env.teamEmail, name: "Équipe OCD Live" }],
    replyTo: info.email ? { email: info.email, name: info.fullName } : undefined,
    subject: `🎥 Nouvelle réservation ${reservation.reference} — ${info.businessName}`,
    text: teamText,
    html: layout(
      "Nouvelle réservation",
      `<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.6">${escapeHtml(teamText)}</pre>`,
    ),
  });

  const client = info.email
    ? sendEmail(env, {
        to: [{ email: info.email, name: info.fullName }],
        subject: `Ta demande de live OCD Live est bien reçue (${reservation.reference})`,
        text: `Bonjour ${info.fullName},\n\nTa demande est bien reçue. L'équipe OCD Live te confirme le créneau sur WhatsApp (${formatPhone(info.phoneCountry, info.phoneNumber)}).\n\nRéférence : ${reservation.reference}\nDate : ${formatDateFr(reservation.date)}\nCréneau : ${formatSlotFr(reservation.slotStart, reservation.slotEnd)} (heure de Lomé)\n\nÀ très vite en live !\nL'équipe OCD Live`,
        html: layout(
          `Merci ${info.fullName}, ta demande est bien reçue !`,
          `<p style="font-size:15px;line-height:1.6">L'équipe OCD Live vérifie la disponibilité et te confirme ton créneau <strong>sur WhatsApp</strong> très vite.</p>${rows(
            reservationRows(reservation),
          )}<p style="font-size:14px;line-height:1.6;margin-top:20px">Garde bien ta référence <strong>${escapeHtml(
            reservation.reference,
          )}</strong>. À très vite en live !</p>`,
        ),
      })
    : Promise.resolve();

  await Promise.all([team, client]);
}

export async function sendCandidatureEmail(candidature: Candidature, env: BrevoEnv): Promise<void> {
  const text = buildCandidatureMessage(candidature).replace(/\*/g, "");
  await sendEmail(env, {
    to: [{ email: env.teamEmail, name: "Équipe OCD Live" }],
    subject: `👩🏾‍💼 Candidature animatrice ${candidature.reference} — ${candidature.data.fullName}`,
    text,
    html: layout(
      "Nouvelle candidature animatrice",
      `<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.6">${escapeHtml(text)}</pre>`,
    ),
  });
}
