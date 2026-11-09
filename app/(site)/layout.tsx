import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LaunchBanner } from "@/components/layout/launch-banner";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { JsonLd, localBusinessJsonLd } from "@/components/seo/json-ld";

/** Habillage du site public (l'espace admin a le sien). */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <LaunchBanner />
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <JsonLd data={localBusinessJsonLd} />
    </>
  );
}
