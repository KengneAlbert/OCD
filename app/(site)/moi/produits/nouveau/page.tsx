import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/marketplace/product-form";
import { marketplaceConfig } from "@/config/marketplace";
import { listMyProducts } from "@/lib/db/marketplace";
import { isSubscriptionActive } from "@/lib/lives";
import { requireVendor } from "@/lib/marketplace/vendor";

export const metadata: Metadata = { title: "Ajouter un produit", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const sub = await requireVendor("/moi/produits/nouveau");
  if (!isSubscriptionActive(sub.paid_until)) redirect("/moi/produits");
  if ((await listMyProducts(sub.id)).length >= marketplaceConfig.maxProducts) redirect("/moi/produits");

  return (
    <div className="mx-auto max-w-xl px-4 pt-8 pb-24 sm:pt-12">
      <Link href="/moi/produits" className="inline-flex min-h-12 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Mes produits
      </Link>
      <h1 className="mt-2 mb-8 text-4xl font-semibold tracking-tight">Nouveau produit</h1>
      <ProductForm defaultCategory={sub.category} />
    </div>
  );
}
