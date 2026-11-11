import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { MyProductThumb } from "@/components/marketplace/product-form";
import { marketplaceConfig } from "@/config/marketplace";
import { listMyProducts, productImageUrl } from "@/lib/db/marketplace";
import { isSubscriptionActive } from "@/lib/lives";
import { requireVendor } from "@/lib/marketplace/vendor";
import { cn, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Mes produits", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MyProductsPage({ searchParams }: { searchParams: Promise<{ ajoute?: string }> }) {
  const sub = await requireVendor();
  const { ajoute } = await searchParams;
  const products = await listMyProducts(sub.id);
  const active = isSubscriptionActive(sub.paid_until);
  const full = products.length >= marketplaceConfig.maxProducts;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8 pb-24 sm:pt-12">
      <Link href="/moi" className="inline-flex min-h-12 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Mon espace
      </Link>
      <div className="mt-2 flex items-end justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">Mes produits</h1>
        <span className="text-sm text-muted-foreground">
          {products.length}/{marketplaceConfig.maxProducts}
        </span>
      </div>

      {ajoute && (
        <p role="status" className="mt-6 rounded-2xl bg-emerald-500/10 px-4 py-3 text-base font-medium text-emerald-800 dark:text-emerald-200">
          Publié sur la marketplace.
        </p>
      )}
      {!active && (
        <p className="mt-6 rounded-2xl bg-ocd-orange/10 px-4 py-3 text-base">
          Tes produits sont cachés tant que l&apos;abonnement n&apos;est pas actif.{" "}
          <Link href="/moi" className="font-semibold underline underline-offset-4">
            Activer
          </Link>
        </p>
      )}
      {active && !sub.phone_e164 && (
        <p className="mt-6 rounded-2xl bg-ocd-orange/10 px-4 py-3 text-base">
          Ajoute ton numéro WhatsApp pour être visible.{" "}
          <Link href="/moi" className="font-semibold underline underline-offset-4">
            Mon profil
          </Link>
        </p>
      )}

      {active && !full && (
        <Link
          href="/moi/produits/nouveau"
          className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-lg font-semibold text-background transition hover:opacity-90"
        >
          <Plus className="size-5" aria-hidden /> Ajouter un produit
        </Link>
      )}

      {products.length === 0 ? (
        <p className="mt-10 text-center text-lg text-muted-foreground">Aucun produit pour l&apos;instant.</p>
      ) : (
        <ul className="mt-8 divide-y divide-border rounded-3xl border border-border bg-card">
          {products.map((p) => {
            const visible = p.status === "actif" && !p.hidden_by_admin;
            return (
              <li key={p.id}>
                <Link href={`/moi/produits/${p.id}`} className="flex items-center gap-4 p-4 transition hover:bg-muted/50">
                  <MyProductThumb src={productImageUrl(p.image_path)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.title}</span>
                    <span className="block text-sm text-muted-foreground">{p.price === null ? "Prix sur demande" : formatPrice(p.price)}</span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-semibold",
                      visible ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {p.hidden_by_admin ? "Retiré par l'équipe" : visible ? "Visible" : "Masqué"}
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {products.length > 0 && (
        <Link href="/marketplace" className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          Voir la marketplace <ExternalLink className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
