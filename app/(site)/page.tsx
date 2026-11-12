import { Hero } from "@/components/home/hero";
import { LivesSection } from "@/components/home/lives-section";
import { Manifesto } from "@/components/home/manifesto";
import {
  BigMarquee,
  FaqPreview,
  FinalCta,
  ForWho,
  HowItWorks,
  LiveFormats,
  PackagesPreview,
} from "@/components/home/sections";
import { MarketplaceSection } from "@/components/home/marketplace-section";
import { JsonLd, launchEventJsonLd } from "@/components/seo/json-ld";

/** Lives et produits changent souvent : page régénérée toutes les 5 minutes. */
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <Hero />
      <BigMarquee />
      <Manifesto />
      <LiveFormats />
      <HowItWorks />
      <PackagesPreview />
      <ForWho />
      <LivesSection />
      <MarketplaceSection />
      <FaqPreview />
      <FinalCta />
      <JsonLd data={launchEventJsonLd} />
    </>
  );
}
