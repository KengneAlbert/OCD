import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/page-header";
import { ProductGrid } from "@/components/marketplace/product-card";
import { listMarketplace, type PublicProduct } from "@/lib/db/marketplace";

/** Accueil : quelques produits de la marketplace (un par vendeur, les plus récents). Masquée s'il n'y en a pas. */
export async function MarketplaceSection({ max = 8 }: { max?: number }) {
  const all = await listMarketplace();
  const seen = new Set<string>();
  const picks: PublicProduct[] = [];
  for (const p of all) {
    if (seen.has(p.vendor.id)) continue;
    seen.add(p.vendor.id);
    picks.push(p);
    if (picks.length === max) break;
  }
  if (!picks.length) return null;

  return (
    <Section
      id="marketplace"
      eyebrow="La marketplace"
      title={
        <>
          Achète directement <span className="accent">aux vendeurs.</span>
        </>
      }
      description="Produits et services des vendeurs OCD Live. Tu les contactes sur WhatsApp, sans intermédiaire."
    >
      <ProductGrid products={picks} />
      <div className="mt-12 flex justify-center">
        <Link
          href="/marketplace"
          className="group inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 font-semibold transition hover:border-foreground/40 hover:bg-muted/60"
        >
          Voir toute la marketplace
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </Section>
  );
}
