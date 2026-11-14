/** Emails liés aux paiements : échec et relances (réservations et abonnements). */
import { livesConfig } from "@/config/lives";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/utils";
import { button, C, detailsCard, esc, heading, layout, paragraph, pill, small } from "./layout";
import type { EmailContent, ReservationView } from "./templates";

const rebookUrl = () => `${siteConfig.url}/reserver`;
const rows = (v: ReservationView): [string, string][] => [
  ["Live", v.liveTypeLabel],
  ["Date", `${v.dateLabel} · ${v.slotLabel}`],
  ["Package", `${v.packageName} · ${v.priceLabel}`],
];

/**
 * Réservation : paiement échoué, ou relance d'une réservation non payée.
 * - `canPay` : le créneau est encore bloqué → bouton « Payer » (lien de paiement) ;
 * - sinon : le créneau a été libéré → bouton « Réserver à nouveau ».
 */
export function reservationPaymentEmail(v: ReservationView, kind: "failed" | "reminder", canPay: boolean): EmailContent {
  const title =
    kind === "failed"
      ? heading(`${v.firstName}, ton paiement n'a pas`, "abouti.")
      : canPay
        ? heading(`${v.firstName}, termine ton`, "paiement.")
        : heading(`${v.firstName}, ton créneau a été`, "libéré.");
  const text =
    kind === "failed"
      ? "Aucun montant n'a été débité. Vérifie ton solde Mobile Money ou essaie un autre numéro."
      : canPay
        ? "Ton créneau est encore bloqué pour quelques minutes. Sans paiement, il sera libéré."
        : "Sans paiement, on a libéré ton créneau. Tu peux réserver de nouveau en 2 minutes.";
  const cta = canPay && v.payUrl ? button(`Payer ${v.priceLabel}`, v.payUrl) : button("Réserver à nouveau", rebookUrl(), "dark");
  const html = layout({
    preheader: kind === "failed" ? "Ton paiement n'a pas abouti." : canPay ? "Ton créneau est encore bloqué." : "Ton créneau a été libéré.",
    body: [
      pill(kind === "failed" ? "Paiement non abouti" : "Réservation non payée", C.sand, C.muted),
      title,
      paragraph(esc(text)),
      detailsCard(rows(v), "Ta demande"),
      cta,
      small(`Référence : ${esc(v.reference)}. Une question ? Réponds à cet email.`),
    ].join(""),
  });
  const link = canPay && v.payUrl ? v.payUrl : rebookUrl();
  return {
    subject: kind === "failed" ? "Ton paiement OCD Live n'a pas abouti" : canPay ? "⏳ Termine ton paiement pour garder ton créneau" : "Ton créneau OCD Live a été libéré",
    html,
    text: `${v.firstName}, ${text}\n${rows(v)
      .map(([k, val]) => `${k} : ${val}`)
      .join("\n")}\n${link}`,
  };
}

/** Abonnement vendeur : paiement échoué, ou relance d'un paiement abandonné. */
export function subscriptionPaymentEmail(v: { firstName: string }, kind: "failed" | "reminder"): EmailContent {
  const url = `${siteConfig.url}/moi`;
  const price = formatPrice(livesConfig.subscriptionPrice);
  const html = layout({
    preheader: kind === "failed" ? "Ton paiement n'a pas abouti." : "Ton abonnement n'est pas encore actif.",
    body: [
      pill(kind === "failed" ? "Paiement non abouti" : "Abonnement en attente", C.sand, C.muted),
      kind === "failed" ? heading(`${v.firstName}, ton paiement n'a pas`, "abouti.") : heading(`${v.firstName}, ton abonnement t'`, "attend."),
      paragraph(
        kind === "failed"
          ? "Aucun montant n'a été débité. Vérifie ton solde Mobile Money ou essaie un autre numéro."
          : `Active-le pour ${esc(price)} et apparais dans l'annuaire des lives et sur la marketplace.`,
      ),
      button(kind === "failed" ? "Réessayer" : `Activer pour ${price}`, url),
    ].join(""),
  });
  return {
    subject: kind === "failed" ? "Ton paiement d'abonnement n'a pas abouti" : "Ton abonnement OCD Live n'est pas encore actif",
    html,
    text: `${v.firstName}, ${kind === "failed" ? "ton paiement n'a pas abouti." : `active ton abonnement (${price}).`}\n${url}`,
  };
}
