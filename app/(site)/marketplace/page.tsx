import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { MarketplaceFilters } from "@/components/marketplace/filters";
import { ProductGrid } from "@/components/marketplace/product-card";
import { getCountry } from "@/config/countries";
import { getCategory } from "@/config/live-categories";
import { livesConfig } from "@/config/lives";
import { listMarketplace, marketplaceCountries, type ProductKind } from "@/lib/db/marketplace";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = { q?: string; pays?: string; categorie?: string; type?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const sp = await searchParams;
  const cat = getCategory(sp.categorie)?.label;
  const country = getCountry(sp.pays?.toUpperCase())?.name;
  const title = ["Marketplace", cat, country].filter(Boolean).join(" · ");
  return {
    title,
    description: "Produits et services des vendeurs OCD Live en Afrique. Contacte-les directement sur WhatsApp.",
    alternates: { canonical: "/marketplace" },
  };
}

export default async function MarketplacePage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const country = getCountry(sp.pays?.toUpperCase()) ? sp.pays!.toUpperCase() : undefined;
  const category = getCategory(sp.categorie) ? sp.categorie : undefined;
  const kind: ProductKind | undefined = sp.type === "produit" || sp.type === "service" ? sp.type : undefined;
  const [products, countries] = await Promise.all([listMarketplace({ country, category, kind, q: sp.q }), marketplaceCountries()]);
  const filtered = Boolean(country || category || kind || sp.q);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(2.4rem,6vw,4rem)] leading-[1] font-semibold tracking-tight">Marketplace</h1>
          <p className="mt-2 text-lg text-muted-foreground">Achète directement aux vendeurs, sur WhatsApp.</p>
        </div>
        <Link href="/moi/produits" className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          Vendre ici <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-8">
        <MarketplaceFilters countries={countries} />
      </div>

      <p className="mt-8 mb-5 text-sm text-muted-foreground">
        {products.length} {products.length > 1 ? "résultats" : "résultat"}
      </p>

      {products.length ? (
        <ProductGrid products={products} />
      ) : (
        <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <PackageSearch className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-xl font-semibold">{filtered ? "Rien trouvé." : "Bientôt des produits ici."}</p>
          {filtered && (
            <Link href="/marketplace" className="mt-4 inline-flex h-12 items-center rounded-full border border-border px-6 font-semibold hover:bg-muted">
              Tout voir
            </Link>
          )}
        </div>
      )}

      <div className="mt-16 flex flex-col items-start gap-4 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-xl font-semibold">Tu vends quelque chose ?</p>
          <p className="mt-1 text-muted-foreground">
            Jusqu&apos;à 12 produits, avec ton abonnement à {formatPrice(livesConfig.subscriptionPrice)}/mois.
          </p>
        </div>
        <Link href="/moi/produits" className="inline-flex h-12 shrink-0 items-center rounded-full bg-foreground px-6 font-semibold text-background hover:opacity-90">
          Ajouter mes produits
        </Link>
      </div>
    </div>
  );
}
