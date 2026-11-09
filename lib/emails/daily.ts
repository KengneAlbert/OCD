/**
 * Email interne envoyé chaque matin à l'équipe (tâche planifiée /api/cron/daily) :
 * lives du jour, lives de demain, chiffres de la veille et points à traiter.
 */
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/utils";
import { C, button, callout, esc, heading, layout, paragraph, pill, small } from "./layout";
import type { EmailContent } from "./templates";

export interface DailyLive {
  slot: string; // « 10h00 – 11h30 »
  businessName: string;
  fullName: string;
  phone: string;
  liveType: "presentiel" | "distance";
  packageName: string;
  status: string; // libellé
  adminUrl: string;
}

export interface DailyRecap {
  dateLabel: string; // « mardi 1er décembre 2026 »
  today: DailyLive[];
  tomorrowCount: number;
  yesterday: { paid: number; revenue: number };
  remindersSent: number;
  remindersFailed: number;
  anomalies: number;
}

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

function livesTable(lives: DailyLive[]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;border-collapse:separate;border-spacing:0 8px">
  ${lives
    .map(
      (l) => `<tr><td style="background:${C.sand};border-radius:14px;padding:14px 16px">
      <a href="${esc(l.adminUrl)}" style="text-decoration:none;color:${C.ink}">
        <span style="display:block;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1px;color:${C.orangeDark}">${esc(l.slot)} · ${
          l.liveType === "presentiel" ? "STUDIO" : "À DISTANCE"
        }</span>
        <span style="display:block;margin-top:4px;font-family:${FONT};font-size:16px;font-weight:800">${esc(l.businessName)}</span>
        <span style="display:block;margin-top:2px;font-family:${FONT};font-size:13px;color:${C.muted}">${esc(l.fullName)} · ${esc(l.phone)} · ${esc(l.packageName)} · ${esc(l.status)}</span>
      </a></td></tr>`,
    )
    .join("")}
  </table>`;
}

export function teamDailyEmail(d: DailyRecap): EmailContent {
  const n = d.today.length;
  const alerts = [
    d.anomalies ? `⚠️ <strong>${d.anomalies} anomalie(s) de paiement</strong> à vérifier (remboursement possible).` : "",
    d.remindersFailed ? `⚠️ <strong>${d.remindersFailed} rappel(s) J-1</strong> n'ont pas pu partir.` : "",
  ].filter(Boolean);

  const html = layout({
    internal: true,
    preheader: n ? `${n} live(s) aujourd'hui · ${d.tomorrowCount} demain` : `Aucun live aujourd'hui · ${d.tomorrowCount} demain`,
    body: [
      pill(`Récap du ${d.dateLabel}`, C.ink, C.orange),
      heading(n ? `${n} live${n > 1 ? "s" : ""} au programme` : "Pas de live", n ? "aujourd'hui." : "aujourd'hui."),
      n ? livesTable(d.today) : paragraph("Journée calme : aucun live payé ou confirmé n'est prévu aujourd'hui."),
      alerts.length ? callout(alerts.join("<br>")) : "",
      paragraph(
        `<strong>Demain :</strong> ${d.tomorrowCount} live(s) · ${d.remindersSent} rappel(s) J-1 envoyé(s) aux clients ce matin.<br>` +
          `<strong>Hier :</strong> ${d.yesterday.paid} réservation(s) payée(s) · ${esc(formatPrice(d.yesterday.revenue))} encaissés.`,
      ),
      button("Ouvrir le planning", `${siteConfig.url}/admin/planning`, "dark"),
      small("Email automatique envoyé chaque matin à 6 h (heure de Lomé)."),
    ].join(""),
  });

  const text = [
    `Récap du ${d.dateLabel}`,
    "",
    n ? `${n} live(s) aujourd'hui :` : "Aucun live aujourd'hui.",
    ...d.today.map((l) => `- ${l.slot} · ${l.businessName} (${l.fullName}, ${l.phone}) · ${l.liveType === "presentiel" ? "studio" : "à distance"} · ${l.packageName}`),
    "",
    d.anomalies ? `Anomalies de paiement à vérifier : ${d.anomalies}` : null,
    d.remindersFailed ? `Rappels J-1 en échec : ${d.remindersFailed}` : null,
    `Demain : ${d.tomorrowCount} live(s) · ${d.remindersSent} rappel(s) envoyé(s).`,
    `Hier : ${d.yesterday.paid} payée(s) · ${formatPrice(d.yesterday.revenue)}.`,
    "",
    `Planning : ${siteConfig.url}/admin/planning`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return {
    subject: n ? `☀️ ${n} live${n > 1 ? "s" : ""} aujourd'hui · récap du ${d.dateLabel}` : `☀️ Récap du ${d.dateLabel} · pas de live aujourd'hui`,
    html,
    text,
  };
}
