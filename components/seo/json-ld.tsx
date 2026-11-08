import { packages } from "@/config/packages";
import { siteConfig } from "@/config/site";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Échappement de « < » pour éviter toute injection dans le script.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

const address = {
  "@type": "PostalAddress",
  streetAddress: siteConfig.studio.street,
  addressLocality: siteConfig.studio.city,
  addressCountry: siteConfig.studio.countryCode,
};

export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${siteConfig.url}/#studio`,
  name: siteConfig.name,
  slogan: siteConfig.slogan,
  description: siteConfig.description,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo-ocd-live.svg`,
  image: `${siteConfig.url}/opengraph-image`,
  telephone: `+${siteConfig.whatsappNumber}`,
  email: siteConfig.email,
  address,
  geo: { "@type": "GeoCoordinates", ...siteConfig.studio.geo },
  openingHours: siteConfig.studio.openingHoursSchema,
  areaServed: ["Togo", "Afrique", "Monde"],
  priceRange: `${Math.min(...packages.map((p) => p.price))} – ${Math.max(...packages.map((p) => p.price))} XOF`,
  currenciesAccepted: "XOF",
  sameAs: siteConfig.socials.map((s) => s.href),
};

export const launchEventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "Lancement d'OCD Live — lives de vente au studio et à distance",
  description: "Ouverture des réservations de lives de vente OCD Live, au studio de Lomé ou à distance depuis toute l'Afrique et le monde.",
  startDate: "2026-12-01T08:00:00+00:00",
  endDate: "2026-12-01T21:30:00+00:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
  image: `${siteConfig.url}/opengraph-image`,
  location: [
    { "@type": "Place", name: siteConfig.studio.name, address },
    { "@type": "VirtualLocation", url: siteConfig.url },
  ],
  organizer: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  offers: {
    "@type": "Offer",
    url: `${siteConfig.url}/reserver`,
    price: String(Math.min(...packages.map((p) => p.price))),
    priceCurrency: "XOF",
    availability: "https://schema.org/LimitedAvailability",
    validFrom: "2026-11-01T00:00:00+00:00",
  },
};
