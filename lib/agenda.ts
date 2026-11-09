/**
 * Fichier agenda (.ics, RFC 5545) d'un live réservé : compatible Google Agenda,
 * Apple Calendrier et Outlook. Fonction pure → testable.
 */
import { siteConfig } from "@/config/site";
import { studioTimeToUtc } from "@/lib/schedule";

export interface AgendaInput {
  reference: string;
  liveType: "presentiel" | "distance";
  date: string; // yyyy-MM-dd (heure de Lomé)
  slotStart: string; // HH:mm
  slotEnd: string;
  packageName: string;
  businessName: string;
  url?: string;
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Échappement des valeurs texte (RFC 5545 §3.3.11). */
const text = (v: string) => v.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Lignes de 75 octets max, suite indentée d'un espace (RFC 5545 §3.1). */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (Buffer.byteLength(current + char, "utf8") > limit) {
      parts.push(current);
      current = char;
    } else current += char;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export const studioAddressLine = () =>
  [siteConfig.studio.name, siteConfig.studio.street, siteConfig.studio.district, `${siteConfig.studio.city}, ${siteConfig.studio.country}`].join(", ");

export function buildIcs(r: AgendaInput, now = new Date()): string {
  const start = studioTimeToUtc(r.date, r.slotStart);
  const end = studioTimeToUtc(r.date, r.slotEnd);
  const presentiel = r.liveType === "presentiel";

  const description = [
    `Ton live OCD Live (${r.packageName}) pour ${r.businessName}.`,
    presentiel
      ? "Arrive au studio 30 minutes avant le début pour l'installation."
      : "Live à distance depuis ton téléphone : l'équipe fait un test de connexion avec toi avant le jour J.",
    "Prépare tes produits, tes prix et ton pitch de 3 phrases.",
    `Référence : ${r.reference}`,
    r.url ? `Détails : ${r.url}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OCD Live//Reservation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${r.reference.toLowerCase()}@ocdlive`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${text(`🎥 Mon live OCD Live · ${r.businessName}`)}`,
    `DESCRIPTION:${text(description)}`,
    `LOCATION:${text(presentiel ? studioAddressLine() : "En ligne · depuis ton téléphone")}`,
    r.url ? `URL:${r.url}` : "",
    "STATUS:CONFIRMED",
    // Rappels : la veille et 1 h avant (1 h 30 en présentiel, pour arriver 30 min avant).
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${text("Demain : ton live OCD Live")}`,
    "TRIGGER:-P1D",
    "END:VALARM",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${text(presentiel ? "Départ pour le studio OCD Live" : "Ton live OCD Live commence bientôt")}`,
    `TRIGGER:${presentiel ? "-PT1H30M" : "-PT1H"}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.map(fold).join("\r\n") + "\r\n";
}
