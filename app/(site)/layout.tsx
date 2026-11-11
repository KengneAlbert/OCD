import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { LaunchBanner } from "@/components/layout/launch-banner";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { JsonLd, localBusinessJsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/config/site";
import { getSettings } from "@/lib/settings";

/** Habillage du site public (l'espace admin a le sien). */
export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { recrutementOuvert } = await getSettings();
  const nav = siteConfig.nav.filter((item) => recrutementOuvert || item.href !== "/recrutement");
  return (
    <>
      <LaunchBanner />
      <Header nav={nav} />
      <main id="contenu">{children}</main>
      <Footer recrutementOuvert={recrutementOuvert} />
      <WhatsAppFloat />
      <JsonLd data={localBusinessJsonLd} />
    </>
  );
}
