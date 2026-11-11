import type { Metadata } from "next";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { ModerateProductButtons } from "@/components/admin/marketplace-buttons";
import { EmptyState, formatDateTime, PageTitle, Panel } from "@/components/admin/ui";
import { getCategory } from "@/config/live-categories";
import { listProductsForAdmin, productImageUrl } from "@/lib/db/marketplace";
import { isSubscriptionActive } from "@/lib/lives";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Marketplace" };
export const dynamic = "force-dynamic";

export default async function AdminMarketplacePage() {
  const now = new Date();
  const products = await listProductsForAdmin();
  const visible = products.filter(
    (p) => p.status === "actif" && !p.hidden_by_admin && p.subscriber?.status === "actif" && isSubscriptionActive(p.subscriber?.paid_until, now) && p.subscriber?.phone_e164,
  );
  const vendors = new Set(products.map((p) => p.subscriber_id)).size;

  return (
    <>
      <PageTitle eyebrow="Produits et services des abonnés" title="Marketplace" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Produits", products.length],
          ["Visibles", visible.length],
          ["Vendeurs", vendors],
          ["Retirés par l'équipe", products.filter((p) => p.hidden_by_admin).length],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <Panel title={`Tous les produits (${products.length})`}>
        {products.length === 0 ? (
          <EmptyState title="Aucun produit pour l'instant">Les abonnés ajoutent leurs produits depuis /moi/produits.</EmptyState>
        ) : (
          <ul className="-my-4 divide-y divide-border">
            {products.map((p) => {
              const src = productImageUrl(p.image_path);
              const isVisible = visible.includes(p);
              return (
                <li key={p.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl bg-muted">{src && <Image src={src} alt="" fill sizes="64px" className="object-cover" />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {p.title} <span className="font-normal text-muted-foreground">· {p.price === null ? "Prix sur demande" : formatPrice(p.price)}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {p.subscriber?.business_name} · {p.subscriber?.city ?? p.subscriber?.country} ·{" "}
                      {getCategory(p.category)?.label} · {p.kind === "service" ? "Prestation" : "Produit"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(p.created_at)} ·{" "}
                      <span className={isVisible ? "font-semibold text-emerald-700 dark:text-emerald-300" : ""}>
                        {p.hidden_by_admin ? "Retiré par l'équipe" : p.status === "masque" ? "Masqué par le vendeur" : isVisible ? "Visible" : "Caché (abonnement ou WhatsApp manquant)"}
                      </span>
                    </p>
                  </div>
                  {isVisible && (
                    <a href={`/marketplace/${p.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent-text hover:underline">
                      Voir <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  )}
                  <ModerateProductButtons id={p.id} hidden={p.hidden_by_admin} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
