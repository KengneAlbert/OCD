import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  Palette,
  Shirt,
  Smartphone,
  Sparkles,
  Sprout,
  UtensilsCrossed,
} from "lucide-react";
import type { BusinessCategory } from "@/types";

/** Catégories d'activité (formulaire + section « Pour qui ? »). */
export const categories: BusinessCategory[] = [
  { id: "restauration", short: "Traiteurs", label: "Restauration / Traiteur", examples: "Plats, pâtisserie, jus, traiteur événementiel", icon: UtensilsCrossed, image: "/metiers/restauration.webp" },
  { id: "mode", short: "Mode", label: "Mode & vêtements", examples: "Pagne, prêt-à-porter, chaussures, sacs", icon: Shirt, image: "/metiers/mode.webp" },
  { id: "cosmetique", short: "Cosmétique", label: "Cosmétique & beauté", examples: "Soins, karité, perruques, maquillage", icon: Sparkles, image: "/metiers/cosmetique.webp" },
  { id: "artisanat", short: "Artisans", label: "Artisanat & déco", examples: "Bijoux, sculptures, vannerie, déco maison", icon: Palette, image: "/metiers/artisanat.webp" },
  { id: "electronique", short: "Électronique", label: "Électronique & téléphonie", examples: "Téléphones, accessoires, électroménager", icon: Smartphone, image: "/metiers/electronique.webp" },
  { id: "agriculture", short: "Agriculture", label: "Agriculture & produits locaux", examples: "Céréales, épices, huiles, produits transformés", icon: Sprout, image: "/metiers/agriculture.webp" },
  { id: "services", short: "Services", label: "Services", examples: "Événementiel, transport, immobilier, réparation", icon: Briefcase, image: "/metiers/services.webp" },
  { id: "formations", short: "Formations", label: "Formations & coaching", examples: "Cours, ateliers, coaching, e-books", icon: GraduationCap, image: "/metiers/formations.webp" },
  { id: "sante", short: "Bien-être", label: "Santé & bien-être", examples: "Produits naturels, sport, nutrition", icon: HeartPulse, image: "/metiers/sante.webp" },
];

/** Crédits des photos de fond (Wikimedia Commons), affichés sous la section « Pour qui ? ». */
export const categoryPhotoCredits = [
  { author: "Akouete", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Plat_de_riz_au_Togo_25.jpg" },
  { author: "ChefDuVillage", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Pagne_kita.JPG" },
  { author: "Adoscam", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:M%C3%A9lange_du_Beurre_de_karit%C3%A9_et_huiles_essentielles_dans_une_boite_pour_massage_02.jpg" },
  { author: "Nkansahrexford", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Judith_beads_jewelry_wla_20.jpeg" },
  { author: "Oxfam East Africa", license: "CC BY 2.0", url: "https://commons.wikimedia.org/wiki/File:Mobile_phone_shop_(7550611126).jpg" },
  { author: "Africa Rice Center", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Agriculture_in_inland_valleys_in_Togo_-_panoramio.jpg" },
  { author: "Rtemanou", license: "CC BY 4.0", url: "https://commons.wikimedia.org/wiki/File:Zemidjan_%C3%A0_Lom%C3%A9,_Togo.jpg" },
  { author: "Bright Kwame Ayisi", license: "CC0", url: "https://commons.wikimedia.org/wiki/File:Wikidata_training_in_Accra_09.jpg" },
  { author: "Challiyan", license: "CC BY 3.0", url: "https://commons.wikimedia.org/wiki/File:Moringa.JPG" },
];

export const OTHER_CATEGORY_ID = "autre";

export const CATEGORY_IDS = [...categories.map((c) => c.id), OTHER_CATEGORY_ID];

export function getCategoryLabel(id: string | undefined, other?: string): string {
  if (id === OTHER_CATEGORY_ID) return other?.trim() ? `Autre — ${other.trim()}` : "Autre";
  return categories.find((c) => c.id === id)?.label ?? "—";
}

/** Options du champ « Nombre de produits à présenter ». */
export const productCountOptions = [
  { value: "1", label: "1 produit" },
  { value: "2-5", label: "2 à 5 produits" },
  { value: "6-10", label: "6 à 10 produits" },
  { value: "10+", label: "Plus de 10 produits" },
] as const;

export function getProductCountLabel(value: string | undefined): string | undefined {
  return productCountOptions.find((o) => o.value === value)?.label;
}
