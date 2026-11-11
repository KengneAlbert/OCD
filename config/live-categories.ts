/** Catégories de l'annuaire des lives (et des boutiques). L'ordre est celui des tuiles. */
export interface LiveCategory {
  slug: string;
  label: string;
  emoji: string;
}

export const categories: LiveCategory[] = [
  { slug: "nourriture", label: "Nourriture", emoji: "🍲" },
  { slug: "mode", label: "Mode", emoji: "👗" },
  { slug: "beaute", label: "Beauté", emoji: "💄" },
  { slug: "electronique", label: "Électronique", emoji: "📱" },
  { slug: "maison", label: "Maison", emoji: "🏠" },
  { slug: "agriculture", label: "Agriculture", emoji: "🌾" },
  { slug: "artisanat", label: "Artisanat", emoji: "🎨" },
  { slug: "services", label: "Services", emoji: "🛠️" },
  { slug: "formations", label: "Formations", emoji: "📚" },
  { slug: "autres", label: "Autres", emoji: "➕" },
];

export const DEFAULT_CATEGORY = "autres";
export const getCategory = (slug: string | null | undefined) => categories.find((c) => c.slug === slug);

/**
 * Images de fond des lives, par catégorie (photos du site, dossier public/).
 * Un vendeur sans photo de couverture garde toujours la même image (choix selon son nom).
 */
const COVERS: Record<string, string[]> = {
  nourriture: ["/metiers/restauration.webp", "/vitrine/fruits.webp", "/vitrine/ignames.webp", "/vitrine/noix-de-coco.webp"],
  mode: ["/metiers/mode.webp"],
  beaute: ["/metiers/cosmetique.webp", "/metiers/sante.webp"],
  electronique: ["/metiers/electronique.webp"],
  maison: ["/vitrine/ustensiles.webp", "/metiers/artisanat.webp"],
  agriculture: ["/metiers/agriculture.webp", "/vitrine/marche-legumes.webp"],
  artisanat: ["/metiers/artisanat.webp"],
  services: ["/metiers/services.webp"],
  formations: ["/metiers/formations.webp"],
  autres: ["/vitrine/grand-marche.webp", "/vitrine/marche-legumes.webp"],
};

export function liveCover(category: string, seed: string): string {
  const list = COVERS[category] ?? COVERS.autres!;
  const h = [...seed].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  return list[h % list.length]!;
}
