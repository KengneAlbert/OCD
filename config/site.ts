/**
 * Informations générales du site — à compléter avec les vraies coordonnées.
 * Toute modification ici se répercute partout (header, footer, SEO, contact).
 */
export const siteConfig = {
  name: "OCD Live",
  slogan: "Le marketing avant la vente",
  description:
    "Réserve ton live de vente avec OCD Live : au studio à Lomé (Togo) avec une régie pro, ou à distance depuis n'importe où en Afrique et dans le monde avec une assistante dédiée. Lancement le 1er décembre 2026.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ocdlive.com").replace(/\/$/, ""),

  /** Lancement : minuit à Lomé (GMT). */
  launchDate: "2026-12-01T00:00:00Z",
  launchLabel: "1er décembre 2026",
  showLaunchBanner: true,

  /** Numéro qui reçoit les réservations (format international sans + ni espaces). */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "22890000000",
  phoneDisplay: "+228 90 00 00 00",
  email: "contact@ocdlive.com",

  studio: {
    name: "Studio OCD Live",
    street: "Adresse du studio (à compléter)",
    district: "Quartier à compléter",
    city: "Lomé",
    country: "Togo",
    countryCode: "TG",
    /** Requête utilisée pour la carte Google Maps intégrée. */
    mapsQuery: "Lomé, Togo",
    geo: { latitude: 6.1319, longitude: 1.2228 },
    hours: "Du lundi au samedi, de 8h à 22h (heure de Lomé, GMT)",
    openingHoursSchema: "Mo-Sa 08:00-22:00",
  },

  socials: [
    { name: "TikTok", href: "https://www.tiktok.com/@ocdlive" },
    { name: "Facebook", href: "https://www.facebook.com/ocdlive" },
    { name: "Instagram", href: "https://www.instagram.com/ocdlive" },
  ],

  agency: { name: "REVOLUTION", href: "https://revolution.tg" },

  nav: [
    { href: "/packages", label: "Packages" },
    { href: "/comment-ca-marche", label: "Comment ça marche" },
    { href: "/studio", label: "Le studio" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
