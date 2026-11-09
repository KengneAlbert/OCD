/**
 * Briques HTML des emails : tableaux + styles en ligne, compatibles Gmail,
 * Outlook, Apple Mail et les webmails mobiles. Aucune dépendance serveur,
 * pour pouvoir prévisualiser les gabarits dans l'admin et les tester.
 */
import { siteConfig } from "@/config/site";

export const C = {
  orange: "#E8792B",
  orangeDark: "#B4531A",
  glow: "#FFD9A0",
  cream: "#FFF4E6",
  sand: "#F4EFE7",
  ink: "#111111",
  muted: "#6B655F",
  line: "#ECE6DD",
  white: "#FFFFFF",
  green: "#25D366",
} as const;

const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Mot en italique orange façon « accent » du site. */
export const accent = (text: string, color: string = C.orange) =>
  `<span style="font-family:${SERIF};font-style:italic;font-weight:400;color:${color}">${esc(text)}</span>`;

export function heading(title: string, accentWord?: string): string {
  return `<h1 style="margin:0 0 14px;font-family:${FONT};font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-0.5px;color:${C.ink}">${esc(title)}${
    accentWord ? ` ${accent(accentWord)}` : ""
  }</h1>`;
}

export const paragraph = (html: string) =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:#2B2724">${html}</p>`;

export const small = (html: string) =>
  `<p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:1.55;color:${C.muted}">${html}</p>`;

/** Pastille de statut en haut du contenu. */
export function pill(label: string, bg: string = C.cream, color: string = C.orangeDark): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px"><tr><td style="background:${bg};border-radius:999px;padding:6px 12px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${color}">${esc(
    label,
  )}</td></tr></table>`;
}

/** Carte de détails (clé / valeur). */
export function detailsCard(rows: [string, string | undefined][], title?: string): string {
  const visible = rows.filter(([, v]) => v !== undefined && v !== "");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 22px;background:${C.sand};border-radius:18px">
  <tr><td style="padding:20px 22px">
  ${
    title
      ? `<p style="margin:0 0 10px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${C.muted}">${esc(title)}</p>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${visible
    .map(
      ([k, v], i) => `<tr>
    <td style="padding:9px 0;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${FONT};font-size:13px;color:${C.muted};vertical-align:top;width:38%">${esc(k)}</td>
    <td style="padding:9px 0;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink};vertical-align:top">${esc(v)}</td>
  </tr>`,
    )
    .join("")}
  </table></td></tr></table>`;
}

/** Bouton « pilule » compatible Outlook (VML inutile : bordure épaisse = zone cliquable). */
export function button(label: string, href: string, variant: "orange" | "dark" | "whatsapp" = "orange"): string {
  const bg = variant === "orange" ? C.orange : variant === "whatsapp" ? C.green : C.ink;
  const color = variant === "dark" ? C.white : C.ink;
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 22px"><tr>
  <td style="border-radius:999px;background:${bg}">
    <a href="${esc(href)}" target="_blank" style="display:inline-block;padding:15px 28px;border:1px solid ${bg};border-radius:999px;font-family:${FONT};font-size:15px;font-weight:700;color:${color};text-decoration:none">${esc(
      label,
    )} &rarr;</a>
  </td></tr></table>`;
}

/** Liste numérotée (étapes, checklist). */
export function steps(items: { title: string; text: string }[], title?: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px">
  ${title ? `<tr><td colspan="2" style="padding:0 0 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${C.muted}">${esc(title)}</td></tr>` : ""}
  ${items
    .map(
      (it, i) => `<tr>
    <td style="width:34px;padding:8px 0;vertical-align:top"><div style="width:26px;height:26px;border-radius:999px;background:${C.ink};color:${C.orange};font-family:${FONT};font-size:12px;font-weight:800;line-height:26px;text-align:center">${i + 1}</div></td>
    <td style="padding:8px 0;vertical-align:top;font-family:${FONT};font-size:14px;line-height:1.5;color:#2B2724"><strong style="color:${C.ink}">${esc(it.title)}</strong><br>${esc(it.text)}</td>
  </tr>`,
    )
    .join("")}
  </table>`;
}

export function callout(html: string, tone: "orange" | "dark" = "orange"): string {
  const bg = tone === "orange" ? C.cream : C.ink;
  const color = tone === "orange" ? "#4A3420" : "#F4EFE7";
  const bar = tone === "orange" ? C.orange : C.orange;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 22px"><tr>
  <td style="width:4px;background:${bar};border-radius:4px"></td>
  <td style="background:${bg};border-radius:0 14px 14px 0;padding:14px 18px;font-family:${FONT};font-size:14px;line-height:1.55;color:${color}">${html}</td>
  </tr></table>`;
}

export const divider = () => `<div style="height:1px;background:${C.line};margin:6px 0 22px;line-height:1px;font-size:1px">&nbsp;</div>`;

interface LayoutOptions {
  /** Texte d'aperçu affiché par les messageries à côté de l'objet. */
  preheader: string;
  body: string;
  /** Email interne (équipe) : bandeau sobre. */
  internal?: boolean;
}

export function layout({ preheader, body, internal = false }: LayoutOptions): string {
  const wa = `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}`;
  return `<!doctype html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>${esc(siteConfig.name)}</title>
<style>
  @media (max-width:620px){ .px{padding-left:22px!important;padding-right:22px!important} .h1{font-size:26px!important} }
  a{color:${C.orangeDark}}
</style>
</head>
<body style="margin:0;padding:0;background:${C.sand};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand}">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

    <!-- En-tête -->
    <tr><td style="background:${C.ink};border-radius:24px 24px 0 0;padding:22px 32px" class="px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-family:${FONT};font-size:26px;font-weight:800;letter-spacing:-1px;color:${C.orange}">OCD <span style="font-family:${SERIF};font-style:italic;font-weight:400;color:${C.white};letter-spacing:0">live</span></td>
        <td align="right" style="font-family:${FONT};font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#BDB6AE">
          ${internal ? "Espace équipe" : `<span style="color:#E5484D">&#9679;</span>&nbsp; En direct de Lomé`}
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="height:4px;background:${C.orange};line-height:4px;font-size:4px">&nbsp;</td></tr>

    <!-- Contenu -->
    <tr><td style="background:${C.white};padding:36px 32px 18px" class="px">${body}</td></tr>

    <!-- Pied -->
    <tr><td style="background:${C.white};border-radius:0 0 24px 24px;padding:0 32px 30px" class="px">
      ${divider()}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted}">
          <strong style="color:${C.ink}">${esc(siteConfig.name)}</strong> · ${esc(siteConfig.slogan)}<br>
          ${esc(siteConfig.studio.street)}, ${esc(siteConfig.studio.city)}, ${esc(siteConfig.studio.country)}<br>
          <a href="${wa}" style="color:${C.orangeDark};text-decoration:none">WhatsApp ${esc(siteConfig.phoneDisplay)}</a> ·
          <a href="${esc(siteConfig.url)}" style="color:${C.orangeDark};text-decoration:none">${esc(siteConfig.url.replace(/^https?:\/\//, ""))}</a>
        </td>
      </tr></table>
    </td></tr>

    <tr><td align="center" style="padding:18px 12px 0;font-family:${FONT};font-size:11px;line-height:1.5;color:#9A938B">
      ${
        internal
          ? "Email interne envoyé automatiquement par le site OCD Live."
          : "Tu reçois cet email suite à ta demande sur le site OCD Live. Réponds simplement à ce message pour nous écrire."
      }
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
