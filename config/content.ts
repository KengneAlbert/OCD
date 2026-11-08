import type { FaqItem } from "@/types";

/** FAQ complète (page /faq). Les 4 premières apparaissent sur l'accueil. */
export const faq: FaqItem[] = [
  {
    question: "Comment se passe un live à distance ?",
    answer:
      "Tu fais ton live depuis chez toi ou ta boutique, avec ton téléphone. Pendant ce temps, une animatrice OCD Live t'accompagne en direct depuis le studio de Lomé : elle présente ton business, relance le public, lit les commentaires et rappelle ton numéro et ton adresse. Avant le live, on fait ensemble un test de connexion.",
  },
  {
    question: "Quelle connexion faut-il pour un live à distance ?",
    answer:
      "Une connexion 4G stable ou un bon wifi suffit. Prévois un téléphone bien chargé (ou branché), posé sur un support, dans un endroit calme et bien éclairé. L'équipe fait un test avec toi avant le jour J pour vérifier que tout fonctionne.",
  },
  {
    question: "Que dois-je apporter au studio ?",
    answer:
      "Tes produits (en quantité suffisante pour les montrer), la liste de tes prix, ta tenue et tes éventuels supports (flyers, kakémono, cartes de visite). Arrive 30 minutes avant ton créneau : on t'installe et on prépare la mise en scène avec la régie.",
  },
  {
    question: "Puis-je présenter plusieurs produits ?",
    answer:
      "Oui ! Indique le nombre de produits dans le formulaire. Pour un live de 1h30, on conseille entre 3 et 10 produits pour que chacun soit bien présenté. Si tu as un grand catalogue, choisis plutôt un pack de plusieurs lives.",
  },
  {
    question: "Sur quel compte le live est-il diffusé ?",
    answer:
      "Les lives sont diffusés sur les comptes OCD Live (TikTok, Facebook…). Tu profites ainsi de notre communauté en plus de la tienne. Partage le lien à tes clients pour qu'ils te rejoignent en direct.",
  },
  {
    question: "Comment est confirmé mon créneau ?",
    answer:
      "Ta demande arrive directement sur notre WhatsApp. L'équipe vérifie la disponibilité, puis te confirme le créneau et les modalités de paiement sur WhatsApp. Ton créneau est définitivement bloqué après paiement.",
  },
  {
    question: "Puis-je reporter mon live ?",
    answer:
      "Oui, tu peux reporter ton live jusqu'à 48 heures avant ton créneau, selon les disponibilités. Préviens simplement l'équipe sur WhatsApp en donnant ta référence (OCD-…).",
  },
  {
    question: "Quels sont les modes de paiement ?",
    answer:
      "Mobile Money (T-Money, Flooz), espèces au studio à Lomé, et pour l'international : MTN Mobile Money, Orange Money, Wave ou virement. Le paiement en ligne directement sur le site arrive bientôt.",
  },
  {
    question: "Faut-il beaucoup d'abonnés pour réserver ?",
    answer:
      "Non. C'est justement le principe d'OCD Live : « le marketing avant la vente ». Tu passes sur nos comptes pour être vu par une nouvelle audience, même si tu débutes.",
  },
  {
    question: "Je ne suis pas au Togo, puis-je réserver ?",
    answer:
      "Bien sûr ! Avec le live à distance, tu peux vendre depuis n'importe quel pays d'Afrique ou du monde. Les créneaux sont affichés en heure de Lomé (GMT), avec la conversion dans ton fuseau horaire.",
  },
];

/** Checklist « Préparer son live ». */
export const prepareChecklist = [
  { title: "Produits prêts", text: "Propres, rangés et faciles à montrer à la caméra." },
  { title: "Prix affichés", text: "Une liste claire de tes prix et de tes promos du jour." },
  { title: "Bon éclairage", text: "Face à la lumière, jamais dos à une fenêtre (à distance)." },
  { title: "Connexion stable", text: "4G ou wifi testé, téléphone chargé et branché (à distance)." },
  { title: "Numéro visible", text: "Ton numéro WhatsApp et ton adresse écrits en grand." },
  { title: "Ton pitch", text: "3 phrases pour dire qui tu es, ce que tu vends et pourquoi te choisir." },
];

/** Conditions de réservation (résumé affiché sur le site). */
export const bookingConditions = [
  "En présentiel, arrive au studio 30 minutes avant le début de ton créneau.",
  "Tout retard est décompté de la durée du live, qui se termine à l'heure prévue.",
  "Le créneau est confirmé par l'équipe sur WhatsApp et définitivement bloqué après paiement.",
  "Report possible jusqu'à 48 heures avant le live, selon les disponibilités. Passé ce délai, le live est dû.",
  "OCD Live peut refuser ou interrompre un live qui ne respecte pas les contenus autorisés.",
];

export const forbiddenContent = [
  "Produits illégaux, contrefaçons ou objets volés",
  "Armes, drogues, médicaments non autorisés",
  "Alcool ou tabac présentés à un public mineur",
  "Arnaques, investissements « miracles », jeux d'argent non autorisés",
  "Contenus haineux, discriminatoires, violents ou à caractère sexuel",
  "Fausses promesses de santé ou de résultats",
];

/** Page Studio — équipement (à ajuster selon le matériel réel). */
export const studioEquipment = [
  { title: "Caméras HD", text: "Plusieurs angles pour montrer tes produits sous toutes leurs coutures." },
  { title: "Éclairage studio", text: "Lumière LED professionnelle et le fameux halo doré de la carte d'Afrique." },
  { title: "Son clair", text: "Micros sans fil pour que ton public entende chaque mot." },
  { title: "Régie de diffusion", text: "Une équipe gère la diffusion, les incrustations (numéro, adresse) et le rythme." },
  { title: "Écran retour", text: "Tu vois les commentaires en direct pour répondre à tes clients." },
  { title: "Connexion dédiée", text: "Une connexion internet réservée aux lives pour une diffusion stable." },
];

/** Photos du studio — ajouter les fichiers dans /public/studio/ puis renseigner `src`. */
export const studioPhotos: { src?: string; alt: string; caption: string }[] = [
  { alt: "Le mur du studio avec la carte d'Afrique rétroéclairée", caption: "La carte d'Afrique lumineuse" },
  { alt: "Le bureau de présentation des produits", caption: "Le bureau de présentation" },
  { alt: "La régie du studio OCD Live", caption: "La régie" },
  { alt: "Un vendeur en live au studio", caption: "En direct au studio" },
];

/** Témoignages — vides au lancement, alimentés ensuite. */
export const testimonials: { name: string; business: string; quote: string; city: string }[] = [];

/**
 * Vitrine « Les OCD passés en live ».
 * Pour ajouter un vrai live : dépose la photo dans /public/vitrine/ (portrait 3:4, ~720×960),
 * puis ajoute une entrée ici SANS `demo`. Dès qu'un vrai live existe, les images
 * d'illustration (`demo: true`) sont masquées automatiquement.
 */
export type ShowcaseItem = {
  business: string;
  category: string;
  /** Date ou libellé court, ex. « 3 déc. 2026 ». */
  date: string;
  image: string;
  alt: string;
  /** Lien vers le replay (Facebook, TikTok…). */
  link?: string;
  /** Nombre réel de spectateurs (laisser vide si inconnu). */
  viewers?: number;
  /** Image d'illustration (pas un vrai client OCD). */
  demo?: boolean;
  /** Crédit photo, obligatoire pour les images sous licence Creative Commons. */
  credit?: { author: string; license: string; url: string };
};

export const showcase: ShowcaseItem[] = [
  {
    business: "Fruits & primeurs",
    category: "Produits locaux",
    date: "Bientôt en live",
    image: "/vitrine/fruits.webp",
    alt: "Vendeuses de fruits sur un marché togolais",
    demo: true,
    credit: { author: "PGskot", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Women_fruit_sellers.jpg" },
  },
  {
    business: "Maraîchers",
    category: "Agriculture",
    date: "Bientôt en live",
    image: "/vitrine/marche-legumes.webp",
    alt: "Étal de légumes coloré sur un marché de Lomé",
    demo: true,
    credit: { author: "Baloo.Togo", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Vendeuse_de_l%C3%A9gumes.jpg" },
  },
  {
    business: "Boutiques du Grand Marché",
    category: "Mode & maison",
    date: "Bientôt en live",
    image: "/vitrine/grand-marche.webp",
    alt: "Commerçantes devant leurs boutiques au grand marché de Lomé",
    demo: true,
    credit: { author: "Step may", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Commerce_au_grand_march%C3%A9_de_Lom%C3%A9.jpg" },
  },
  {
    business: "Noix de coco",
    category: "Boissons",
    date: "Bientôt en live",
    image: "/vitrine/noix-de-coco.webp",
    alt: "Revendeuse de noix de coco assise devant son stock",
    demo: true,
    credit: { author: "Bamouzou", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Revendeuse_de_noix_de_coco_03.jpg" },
  },
  {
    business: "Ignames",
    category: "Produits locaux",
    date: "Bientôt en live",
    image: "/vitrine/ignames.webp",
    alt: "Ignames empilées sur un étal de marché",
    demo: true,
    credit: { author: "PGskot", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Selling_the_igname.jpg" },
  },
  {
    business: "Cuisine & vaisselle",
    category: "Maison",
    date: "Bientôt en live",
    image: "/vitrine/ustensiles.webp",
    alt: "Ustensiles de cuisine et vaisselle exposés au sol",
    demo: true,
    credit: { author: "Bamouzou", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Ustensile_de_cuisine_et_de_couverts_01.jpg" },
  },
];
