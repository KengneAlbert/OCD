import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { PageHeader, Section } from "@/components/layout/page-header";
import { ComparisonTable } from "@/components/packages/comparison-table";
import { PackageCard } from "@/components/packages/package-card";
import { Button } from "@/components/ui/button";
import { packages } from "@/config/packages";
import { PAYMENT_SUMMARY } from "@/config/payment-methods";

export const metadata: Metadata = {
  title: "Packages et prix",
  description:
    "Les 6 packages OCD Live : Live Découverte, Live à Distance, Pack 4 Lives, Pack Promo, Pack Visibilité+ et Pack Mensuel. Prix en FCFA et tableau comparatif.",
  alternates: { canonical: "/packages" },
};

export default function PackagesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Packages"
        title="Choisis la formule qui te fait briller"
        description="Du premier live découverte à la présence tout le mois : chaque package inclut l'accompagnement OCD Live et l'affichage de ton numéro et de ton adresse."
      />

      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
        <p className="mt-8 flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Prix en FCFA, payés en ligne au moment de réserver : {PAYMENT_SUMMARY}.
        </p>
      </Section>

      <div className="bg-surface">
        <Section id="comparatif" eyebrow="Comparatif" title="Tous les packages côte à côte">
          <ComparisonTable />
        </Section>
      </div>

      <Section title="Tu hésites ?" description="Écris-nous sur WhatsApp, on t'aide à choisir le package adapté à ton business.">
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/reserver">Réserver mon live</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Poser une question</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
