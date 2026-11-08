import type { Country } from "@/types";

/** Pays proposés dans les sélecteurs (indicatif téléphonique + pays du live à distance). */
export const countries: Country[] = [
  // Afrique — pays mis en avant
  { code: "TG", name: "Togo", dialCode: "+228", region: "afrique-prioritaire" },
  { code: "BJ", name: "Bénin", dialCode: "+229", region: "afrique-prioritaire" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", region: "afrique-prioritaire" },
  { code: "CM", name: "Cameroun", dialCode: "+237", region: "afrique-prioritaire" },
  { code: "CF", name: "Centrafrique", dialCode: "+236", region: "afrique-prioritaire" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226", region: "afrique-prioritaire" },
  { code: "SN", name: "Sénégal", dialCode: "+221", region: "afrique-prioritaire" },
  { code: "GA", name: "Gabon", dialCode: "+241", region: "afrique-prioritaire" },
  { code: "CG", name: "Congo", dialCode: "+242", region: "afrique-prioritaire" },
  { code: "CD", name: "RD Congo", dialCode: "+243", region: "afrique-prioritaire" },
  { code: "GH", name: "Ghana", dialCode: "+233", region: "afrique-prioritaire" },
  { code: "NG", name: "Nigeria", dialCode: "+234", region: "afrique-prioritaire" },
  { code: "ML", name: "Mali", dialCode: "+223", region: "afrique-prioritaire" },
  { code: "NE", name: "Niger", dialCode: "+227", region: "afrique-prioritaire" },
  { code: "GN", name: "Guinée", dialCode: "+224", region: "afrique-prioritaire" },

  // Reste de l'Afrique
  { code: "ZA", name: "Afrique du Sud", dialCode: "+27", region: "afrique" },
  { code: "DZ", name: "Algérie", dialCode: "+213", region: "afrique" },
  { code: "AO", name: "Angola", dialCode: "+244", region: "afrique" },
  { code: "BW", name: "Botswana", dialCode: "+267", region: "afrique" },
  { code: "BI", name: "Burundi", dialCode: "+257", region: "afrique" },
  { code: "CV", name: "Cap-Vert", dialCode: "+238", region: "afrique" },
  { code: "KM", name: "Comores", dialCode: "+269", region: "afrique" },
  { code: "DJ", name: "Djibouti", dialCode: "+253", region: "afrique" },
  { code: "EG", name: "Égypte", dialCode: "+20", region: "afrique" },
  { code: "ER", name: "Érythrée", dialCode: "+291", region: "afrique" },
  { code: "SZ", name: "Eswatini", dialCode: "+268", region: "afrique" },
  { code: "ET", name: "Éthiopie", dialCode: "+251", region: "afrique" },
  { code: "GM", name: "Gambie", dialCode: "+220", region: "afrique" },
  { code: "GW", name: "Guinée-Bissau", dialCode: "+245", region: "afrique" },
  { code: "GQ", name: "Guinée équatoriale", dialCode: "+240", region: "afrique" },
  { code: "KE", name: "Kenya", dialCode: "+254", region: "afrique" },
  { code: "LS", name: "Lesotho", dialCode: "+266", region: "afrique" },
  { code: "LR", name: "Liberia", dialCode: "+231", region: "afrique" },
  { code: "LY", name: "Libye", dialCode: "+218", region: "afrique" },
  { code: "MG", name: "Madagascar", dialCode: "+261", region: "afrique" },
  { code: "MW", name: "Malawi", dialCode: "+265", region: "afrique" },
  { code: "MA", name: "Maroc", dialCode: "+212", region: "afrique" },
  { code: "MU", name: "Maurice", dialCode: "+230", region: "afrique" },
  { code: "MR", name: "Mauritanie", dialCode: "+222", region: "afrique" },
  { code: "MZ", name: "Mozambique", dialCode: "+258", region: "afrique" },
  { code: "NA", name: "Namibie", dialCode: "+264", region: "afrique" },
  { code: "UG", name: "Ouganda", dialCode: "+256", region: "afrique" },
  { code: "RW", name: "Rwanda", dialCode: "+250", region: "afrique" },
  { code: "ST", name: "Sao Tomé-et-Principe", dialCode: "+239", region: "afrique" },
  { code: "SC", name: "Seychelles", dialCode: "+248", region: "afrique" },
  { code: "SL", name: "Sierra Leone", dialCode: "+232", region: "afrique" },
  { code: "SO", name: "Somalie", dialCode: "+252", region: "afrique" },
  { code: "SD", name: "Soudan", dialCode: "+249", region: "afrique" },
  { code: "SS", name: "Soudan du Sud", dialCode: "+211", region: "afrique" },
  { code: "TZ", name: "Tanzanie", dialCode: "+255", region: "afrique" },
  { code: "TD", name: "Tchad", dialCode: "+235", region: "afrique" },
  { code: "TN", name: "Tunisie", dialCode: "+216", region: "afrique" },
  { code: "ZM", name: "Zambie", dialCode: "+260", region: "afrique" },
  { code: "ZW", name: "Zimbabwe", dialCode: "+263", region: "afrique" },

  // Reste du monde (diaspora)
  { code: "FR", name: "France", dialCode: "+33", region: "monde" },
  { code: "BE", name: "Belgique", dialCode: "+32", region: "monde" },
  { code: "CH", name: "Suisse", dialCode: "+41", region: "monde" },
  { code: "LU", name: "Luxembourg", dialCode: "+352", region: "monde" },
  { code: "CA", name: "Canada", dialCode: "+1", region: "monde" },
  { code: "US", name: "États-Unis", dialCode: "+1", region: "monde" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44", region: "monde" },
  { code: "DE", name: "Allemagne", dialCode: "+49", region: "monde" },
  { code: "IT", name: "Italie", dialCode: "+39", region: "monde" },
  { code: "ES", name: "Espagne", dialCode: "+34", region: "monde" },
  { code: "PT", name: "Portugal", dialCode: "+351", region: "monde" },
  { code: "NL", name: "Pays-Bas", dialCode: "+31", region: "monde" },
  { code: "AE", name: "Émirats arabes unis", dialCode: "+971", region: "monde" },
  { code: "SA", name: "Arabie saoudite", dialCode: "+966", region: "monde" },
  { code: "QA", name: "Qatar", dialCode: "+974", region: "monde" },
  { code: "LB", name: "Liban", dialCode: "+961", region: "monde" },
  { code: "TR", name: "Turquie", dialCode: "+90", region: "monde" },
  { code: "CN", name: "Chine", dialCode: "+86", region: "monde" },
  { code: "IN", name: "Inde", dialCode: "+91", region: "monde" },
  { code: "BR", name: "Brésil", dialCode: "+55", region: "monde" },
  { code: "HT", name: "Haïti", dialCode: "+509", region: "monde" },
];

export const DEFAULT_COUNTRY_CODE = "TG";

export const countryGroups: { label: string; region: Country["region"] }[] = [
  { label: "Afrique de l'Ouest et du Centre", region: "afrique-prioritaire" },
  { label: "Reste de l'Afrique", region: "afrique" },
  { label: "Reste du monde", region: "monde" },
];

export function getCountry(code: string | undefined): Country | undefined {
  return countries.find((c) => c.code === code);
}
