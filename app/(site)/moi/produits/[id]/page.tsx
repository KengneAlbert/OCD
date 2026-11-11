import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductDangerZone, ProductForm } from "@/components/marketplace/product-form";
import { getMyProduct, productImageUrl } from "@/lib/db/marketplace";
import { requireVendor } from "@/lib/marketplace/vendor";

export const metadata: Metadata = { title: "Modifier un produit", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sub = await requireVendor(`/moi/produits/${id}`);
  const p = await getMyProduct(sub.id, id);
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 pt-8 pb-24 sm:pt-12">
      <Link href="/moi/produits" className="inline-flex min-h-12 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Mes produits
      </Link>
      <h1 className="mt-2 mb-8 text-4xl font-semibold tracking-tight">Modifier</h1>
      {p.hidden_by_admin && (
        <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-base text-red-800 dark:text-red-200">L&apos;équipe a retiré ce produit. Contacte-nous pour en savoir plus.</p>
      )}
      <ProductForm
        defaultCategory={sub.category}
        defaults={{ id: p.id, title: p.title, description: p.description, price: p.price, kind: p.kind, category: p.category, imageUrl: productImageUrl(p.image_path) }}
      />
      <div className="mt-10 border-t border-border pt-6">
        <ProductDangerZone id={p.id} visible={p.status === "actif"} />
      </div>
    </div>
  );
}
