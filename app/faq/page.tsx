import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section } from "@/components/layout/page-header";
import { JsonLd } from "@/components/seo/json-ld";
import { FaqList } from "@/components/shared/faq-list";
import { Button } from "@/components/ui/button";
import { faq } from "@/config/content";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description:
    "Live à distance, connexion, matériel à apporter, diffusion, confirmation du créneau, report, paiement : toutes les réponses sur OCD Live.",
  alternates: { canonical: "/faq" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="FAQ" title="Questions fréquentes" description="Tout ce qu'il faut savoir avant de passer en live." />
      <Section>
        <div className="mx-auto max-w-3xl">
          <FaqList items={faq} />
          <div className="mt-10 rounded-3xl bg-surface p-6 text-center sm:p-8">
            <p className="font-display text-xl font-bold">Tu n&apos;as pas trouvé ta réponse ?</p>
            <p className="mt-1 text-muted-foreground">L&apos;équipe te répond sur WhatsApp.</p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/contact">Nous contacter</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/reserver">Réserver mon live</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>
      <JsonLd data={faqJsonLd} />
    </>
  );
}
