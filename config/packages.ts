import type { LivePackage, PackageId } from "@/types";

/**
 * Packages OCD Live — PRIX À CONFIRMER AVEC LE CLIENT.
 * Modifier ici : prix, inclus, compatibilité, mise en avant. Aucun composant à toucher.
 */
export const PACKAGE_IDS = [
  "decouverte",
  "distance",
  "pack-4",
  "promo",
  "visibilite-plus",
  "mensuel",
] as const satisfies readonly PackageId[];

export const packages: LivePackage[] = [
  {
    id: "decouverte",
    name: "Live Découverte",
    tagline: "Ton premier live au studio, accompagné par la régie.",
    price: 15000,
    currency: "FCFA",
    liveDurationMinutes: 90,
    livesCount: 1,
    livesLabel: "1 live",
    includes: [
      "1 live de 1h30 au studio OCD Live à Lomé",
      "Régie professionnelle incluse (caméras, lumière, son)",
      "Ton numéro et ton adresse affichés à l'écran",
      "Diffusion sur les comptes OCD Live",
    ],
    compatibleWith: ["presentiel"],
    highlighted: true,
    popular: false,
    features: { promoVideo: "aucune", socialHighlight: false, coaching: false, priority: false },
  },
  {
    id: "distance",
    name: "Live à Distance",
    tagline: "Vends depuis chez toi ou ta boutique, où que tu sois.",
    price: 20000,
    currency: "FCFA",
    liveDurationMinutes: 90,
    livesCount: 1,
    livesLabel: "1 live",
    includes: [
      "1 live de 1h30 depuis chez toi ou ta boutique",
      "Une assistante OCD t'accompagne en direct depuis le studio",
      "Test de connexion avec l'équipe avant le live",
      "Ton numéro et ton adresse affichés à l'écran",
    ],
    compatibleWith: ["distance"],
    highlighted: true,
    popular: false,
    features: { promoVideo: "aucune", socialHighlight: false, coaching: false, priority: false },
  },
  {
    id: "pack-4",
    name: "Pack 4 Lives",
    tagline: "Reviens régulièrement et fidélise tes clients.",
    price: 50000,
    originalPrice: 60000,
    currency: "FCFA",
    liveDurationMinutes: 90,
    livesCount: 4,
    livesLabel: "4 lives",
    includes: [
      "4 lives de 1h30",
      "Prix réduit : 12 500 FCFA le live",
      "En présentiel ou à distance, au choix",
      "Dates à programmer avec l'équipe",
    ],
    compatibleWith: ["presentiel", "distance"],
    highlighted: true,
    popular: true,
    features: { promoVideo: "aucune", socialHighlight: false, coaching: false, priority: false },
  },
  {
    id: "promo",
    name: "Pack Promo",
    tagline: "On annonce ton passage avant le live.",
    price: 30000,
    currency: "FCFA",
    liveDurationMinutes: 90,
    livesCount: 1,
    livesLabel: "1 live",
    includes: [
      "1 live de 1h30 (présentiel ou à distance)",
      "Vidéo d'annonce publiée sur le compte OCD Live avant ton passage",
      "Ta communauté prévenue : plus de monde au rendez-vous",
      "Ton numéro et ton adresse affichés à l'écran",
    ],
    compatibleWith: ["presentiel", "distance"],
    highlighted: false,
    popular: false,
    features: { promoVideo: "avant-le-live", socialHighlight: false, coaching: false, priority: false },
  },
  {
    id: "visibilite-plus",
    name: "Pack Visibilité+",
    tagline: "Le pack complet pour te faire connaître.",
    price: 80000,
    currency: "FCFA",
    liveDurationMinutes: 90,
    livesCount: 4,
    livesLabel: "4 lives",
    includes: [
      "4 lives de 1h30",
      "Vidéo promo publiée sur les réseaux OCD Live",
      "Ton numéro et ton adresse mis en avant sur nos réseaux",
      "En présentiel ou à distance, au choix",
    ],
    compatibleWith: ["presentiel", "distance"],
    highlighted: false,
    popular: false,
    features: { promoVideo: "avant-le-live", socialHighlight: true, coaching: false, priority: false },
  },
  {
    id: "mensuel",
    name: "Pack Mensuel",
    tagline: "Ta vitrine en direct, tout le mois.",
    price: 150000,
    currency: "FCFA",
    liveDurationMinutes: 90,
    livesCount: null,
    livesLabel: "Lives réguliers tout le mois",
    includes: [
      "Lives réguliers sur tout le mois (planning défini ensemble)",
      "Vidéo promo avant chaque live",
      "Accompagnement personnalisé : conseils de vente et mise en scène",
      "Priorité sur les créneaux",
    ],
    compatibleWith: ["presentiel", "distance"],
    highlighted: false,
    popular: false,
    features: { promoVideo: "avant-chaque-live", socialHighlight: true, coaching: true, priority: true },
  },
];

export function getPackage(id: string | undefined): LivePackage | undefined {
  return packages.find((p) => p.id === id);
}

export function isPackageCompatible(pkg: LivePackage, liveType: LivePackage["compatibleWith"][number]): boolean {
  return pkg.compatibleWith.includes(liveType);
}
