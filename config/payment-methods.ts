/**
 * Moyens de paiement couverts par Swinmo Pay — source unique pour tous les textes du site.
 * Référence : https://www.swinmo.shop/supported-countries (relevé du 9 novembre 2026).
 * Ne citer AUCUN autre moyen de paiement (pas d'espèces, pas de virement).
 */

export interface PaymentCountry {
  code: string;
  name: string;
  methods: string[];
}

export const paymentCountries: PaymentCountry[] = [
  { code: "TG", name: "Togo", methods: ["T-Money (Togocel)", "Moov Money"] },
  { code: "BJ", name: "Bénin", methods: ["MTN Mobile Money", "Moov Money", "Celtiis Cash"] },
  { code: "BF", name: "Burkina Faso", methods: ["Orange Money", "Moov Money"] },
  { code: "CI", name: "Côte d'Ivoire", methods: ["Orange Money", "MTN Mobile Money", "Wave", "Moov Money", "Djamo"] },
  { code: "ML", name: "Mali", methods: ["Orange Money", "Moov Money", "Mobi Cash"] },
  { code: "NE", name: "Niger", methods: ["Airtel Money"] },
  { code: "SN", name: "Sénégal", methods: ["Orange Money", "Wave", "Free Money", "Wizall Money", "Expresso", "Djamo"] },
  { code: "CM", name: "Cameroun", methods: ["MTN Mobile Money", "Orange Money"] },
  { code: "CG", name: "Congo-Brazzaville", methods: ["MTN Mobile Money", "Airtel Money"] },
  { code: "GA", name: "Gabon", methods: ["Airtel Money"] },
  { code: "CD", name: "RD Congo", methods: ["Vodacom M-Pesa", "Orange Money", "Airtel Money", "Afrimoney"] },
  { code: "GH", name: "Ghana", methods: ["MTN Mobile Money", "Telecel Cash", "AirtelTigo Money"] },
  { code: "GN", name: "Guinée", methods: ["MTN Mobile Money"] },
  { code: "SL", name: "Sierra Leone", methods: ["Orange Money"] },
  { code: "KE", name: "Kenya", methods: ["M-Pesa", "Airtel Money"] },
  { code: "UG", name: "Ouganda", methods: ["MTN Mobile Money", "Airtel Money"] },
  { code: "RW", name: "Rwanda", methods: ["MTN Mobile Money", "Airtel Money"] },
  { code: "TZ", name: "Tanzanie", methods: ["Vodacom M-Pesa", "Airtel Money", "Tigo Pesa", "HaloPesa", "EzyPesa", "TTCL"] },
];

/** Carte bancaire acceptée depuis n'importe quel pays (débitée en dollars US par Swinmo). */
export const CARD_LABEL = "carte Visa ou Mastercard";

/** Résumé court, pour les boutons et mentions. */
export const PAYMENT_SUMMARY = `Mobile Money (T-Money, Moov Money, Orange Money, MTN, Wave… dans ${paymentCountries.length} pays d'Afrique) ou ${CARD_LABEL}`;

/** Phrase complète, pour la FAQ et les pages d'information. */
export const PAYMENT_DETAILS = `Le paiement se fait en ligne, au moment de réserver, via Swinmo Pay. Au Togo : T-Money ou Moov Money. Le Mobile Money est aussi accepté dans ${paymentCountries.length - 1} autres pays d'Afrique (${paymentCountries
  .slice(1)
  .map((c) => c.name)
  .join(", ")}) : Orange Money, MTN Mobile Money, Wave, Airtel Money, M-Pesa, etc. selon le pays. Depuis n'importe quel autre pays, tu peux payer par ${CARD_LABEL} (débitée en dollars US). Pas de paiement en espèces ni par virement.`;
