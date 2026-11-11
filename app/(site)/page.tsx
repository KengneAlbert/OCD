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
import { Vitrine } from "@/components/home/vitrine";
import { JsonLd, launchEventJsonLd } from "@/components/seo/json-ld";

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
      <Vitrine />
      <FaqPreview />
      <FinalCta />
      <JsonLd data={launchEventJsonLd} />
    </>
  );
}
