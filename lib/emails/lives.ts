/** Emails liés à l'abonnement et aux lives proposés par les vendeurs. */
import { livesConfig } from "@/config/lives";
import { siteConfig } from "@/config/site";
import { windowsLabel } from "@/lib/lives";
import { formatPrice } from "@/lib/utils";
import { C, button, callout, detailsCard, esc, heading, layout, paragraph, pill, small } from "./layout";
import type { EmailContent } from "./templates";

const espace = () => `${siteConfig.url}/moi`;
const enLive = () => `${siteConfig.url}/je-suis-en-live`;
const dateFr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Abonné : paiement reçu, abonnement actif. */
export function subscriptionPaidEmail(v: { firstName: string; paidUntil: string; amount: number }): EmailContent {
  const html = layout({
    preheader: `Ton abonnement est actif jusqu'au ${dateFr(v.paidUntil)}.`,
    body: [
      pill("Abonnement actif", "#EFE9FF", "#5B3BB5"),
      heading(`Bienvenue ${v.firstName}, tes lives vont être`, "vus."),
      paragraph(
        `Paiement de <strong>${esc(formatPrice(v.amount))}</strong> reçu. Ton abonnement est actif jusqu'au <strong>${esc(dateFr(v.paidUntil))}</strong>.`,
      ),
      callout(
        `<strong>Comment ça marche :</strong> lance ton live sur TikTok, puis appuie sur « Je suis en live » et colle le lien. L'équipe valide (${esc(
          windowsLabel(),
        )}, heure de Lomé) et tu apparais dans l'annuaire de ton pays.`,
      ),
      button("🔴 Je suis en live", enLive(), "dark"),
      small("Pas de renouvellement automatique : on te prévient quelques jours avant la fin."),
    ].join(""),
  });
  return {
    subject: `✅ Ton abonnement OCD Live est actif (jusqu'au ${dateFr(v.paidUntil)})`,
    html,
    text: `Bienvenue ${v.firstName} ! Abonnement actif jusqu'au ${dateFr(v.paidUntil)}.\nQuand tu es en live : ${enLive()}\nValidation : ${windowsLabel()} (heure de Lomé).`,
  };
}

/** Abonné : l'abonnement se termine bientôt. */
export function subscriptionReminderEmail(v: { firstName: string; paidUntil: string }): EmailContent {
  const html = layout({
    preheader: `Ton abonnement se termine le ${dateFr(v.paidUntil)}.`,
    body: [
      pill("Renouvellement"),
      heading(`${v.firstName}, ton abonnement se termine`, "bientôt."),
      paragraph(
        `Il est valable jusqu'au <strong>${esc(dateFr(v.paidUntil))}</strong>. Renouvelle-le (${esc(formatPrice(livesConfig.subscriptionPrice))} pour ${
          livesConfig.subscriptionDays
        } jours) pour rester dans l'annuaire des lives.`,
      ),
      button("Renouveler mon abonnement", espace()),
    ].join(""),
  });
  return {
    subject: `⏳ Ton abonnement OCD Live se termine le ${dateFr(v.paidUntil)}`,
    html,
    text: `${v.firstName}, ton abonnement se termine le ${dateFr(v.paidUntil)}. Renouvelle-le ici : ${espace()}`,
  };
}

/** Abonné : live validé ou refusé. */
export function liveReviewEmail(v: { firstName: string; approved: boolean; reason?: string; countryUrl?: string }): EmailContent {
  const listUrl = v.countryUrl ?? `${siteConfig.url}/live`;
  const html = layout({
    preheader: v.approved ? "Ton live est affiché sur OCD Live." : "Ton live n'a pas été validé.",
    body: [
      v.approved ? pill("Live en ligne", "#E7F8EE", "#1E7A46") : pill("Live non validé", C.sand, C.muted),
      heading(v.approved ? `${v.firstName}, ton live est` : "Ton live n'a pas été", v.approved ? "en ligne." : "validé."),
      paragraph(
        v.approved
          ? `Tu apparais maintenant dans l'annuaire de ton pays sur ${esc(siteConfig.name)}. Les visiteurs te rejoignent en un tap.`
          : `Ton live n'a pas été affiché.${v.reason ? ` Motif : <strong>${esc(v.reason)}</strong>.` : ""} Tu peux renvoyer un lien pendant le créneau.`,
      ),
      button(v.approved ? "Voir l'annuaire" : "🔴 Je suis en live", v.approved ? listUrl : enLive(), "dark"),
    ].join(""),
  });
  return {
    subject: v.approved ? `🔴 Ton live est en ligne sur OCD Live` : `Ton live n'a pas été validé`,
    html,
    text: v.approved ? `Ton live est en ligne : ${listUrl}` : `Ton live n'a pas été validé.${v.reason ? ` Motif : ${v.reason}.` : ""} ${enLive()}`,
  };
}

/** Équipe : un live attend la validation. */
export function liveToReviewEmail(v: { businessName: string; platform: string; url: string; category: string; country: string; endsLabel: string }): EmailContent {
  const html = layout({
    internal: true,
    preheader: `${v.businessName} attend ta validation.`,
    body: [
      pill("Live à valider", C.ink, C.orange),
      heading(v.businessName, "est en live."),
      detailsCard(
        [
          ["Plateforme", v.platform],
          ["Catégorie", v.category],
          ["Pays", v.country],
          ["Affiché jusqu'à", v.endsLabel],
        ],
        "Live envoyé",
      ),
      button("Ouvrir le live", v.url),
      button("Valider dans l'admin", `${siteConfig.url}/admin/lives`, "dark"),
    ].join(""),
  });
  return {
    subject: `🔴 Live à valider · ${v.businessName} (${v.platform})`,
    html,
    text: `Live à valider : ${v.businessName} · ${v.platform} · ${v.category} · ${v.country}
${v.url}
${siteConfig.url}/admin/lives`,
  };
}
