import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { ShareButton } from "@/components/lives/share-button";
import { priceLabel, ProductGrid, WhatsAppIcon, whatsappLink } from "@/components/marketplace/product-card";
import { getCategory } from "@/config/live-categories";
import { getPublicProduct } from "@/lib/db/marketplace";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicProduct((await params).id);
  if (!data) return { title: "Produit introuvable" };
  const { product: p } = data;
  const description = `${priceLabel(p)} · ${p.vendor.businessName}, ${p.vendor.city ?? p.vendor.countryName}. Commande sur WhatsApp via OCD Live.`;
  return {
    title: p.title,
    description,
    alternates: { canonical: `/marketplace/${p.id}` },
    openGraph: { title: p.title, description, images: p.imageUrl ? [{ url: p.imageUrl }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const data = await getPublicProduct((await params).id);
  if (!data) notFound();
  const { product: p, others } = data;
  const wa = whatsappLink(p);
  const cat = getCategory(p.category);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-8 sm:pt-12">
      <Link href="/marketplace" className="inline-flex min-h-12 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Marketplace
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
          {p.imageUrl && <Image src={p.imageUrl} alt={p.title} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />}
        </div>

        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground">
            {[cat?.label, p.kind === "service" ? "Prestation" : null].filter(Boolean).join(" · ")}
          </p>
          <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{p.title}</h1>
          <p className="mt-4 text-2xl font-semibold">{priceLabel(p)}</p>
          {p.description && <p className="mt-6 text-lg leading-relaxed whitespace-pre-line text-muted-foreground">{p.description}</p>}

          {p.vendor.liveUrl && (
            <a
              href={p.vendor.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex items-center gap-3 rounded-2xl bg-[#FE2C55]/10 px-4 py-3 font-semibold text-[#c8193f] transition hover:bg-[#FE2C55]/15 dark:text-[#ff6b8a]"
            >
              <span className="rounded-[4px] bg-[#FE2C55] px-1.5 py-[3px] text-[10px] leading-none font-bold tracking-wider text-white">LIVE</span>
              En live maintenant sur TikTok
              <Play className="ml-auto size-4 fill-current" aria-hidden />
            </a>
          )}

          <div className="mt-8 space-y-3">
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-lg font-semibold text-ocd-black transition hover:brightness-95"
              >
                <WhatsAppIcon className="size-5" /> Commander sur WhatsApp
              </a>
            )}
            <ShareButton text={`${p.title} · ${priceLabel(p)} sur OCD Live`} path={`/marketplace/${p.id}`} className="h-12 w-full" />
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
            <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold">
              {p.vendor.avatarUrl ? <Image src={p.vendor.avatarUrl} alt="" fill unoptimized sizes="44px" className="object-cover" /> : p.vendor.businessName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{p.vendor.businessName}</p>
              <p className="truncate text-sm text-muted-foreground">
                {p.vendor.city ? `${p.vendor.city}, ` : ""}
                {p.vendor.countryName} ·{" "}
                <a href={`https://www.tiktok.com/@${p.vendor.tiktokHandle}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  @{p.vendor.tiktokHandle}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-semibold">Du même vendeur</h2>
          <ProductGrid products={others} />
        </section>
      )}
    </div>
  );
}
