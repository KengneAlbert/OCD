import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { siteConfig } from "@/config/site";
import type { PublicProduct } from "@/lib/db/marketplace";
import { cn, formatPrice } from "@/lib/utils";

export const priceLabel = (p: Pick<PublicProduct, "price">) => (p.price === null ? "Prix sur demande" : formatPrice(p.price));

/** Lien WhatsApp avec message pré-rempli. */
export function whatsappLink(p: PublicProduct): string | null {
  if (!p.vendor.whatsapp) return null;
  const text = `Bonjour, je viens d'OCD Live. Je suis intéressé(e) par : ${p.title} (${priceLabel(p)}).\n${siteConfig.url}/marketplace/${p.id}`;
  return `https://wa.me/${p.vendor.whatsapp}?text=${encodeURIComponent(text)}`;
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2S21.8 6.6 21.8 12 17.4 21.8 12 21.8zM12 .2C5.5.2.2 5.5.2 12c0 2.1.5 4.1 1.6 5.9L.1 23.9l6.2-1.6c1.7.9 3.7 1.4 5.7 1.4 6.5 0 11.8-5.3 11.8-11.8S18.5.2 12 .2z" />
    </svg>
  );
}

/** Carte produit : toute la carte ouvre la fiche ; le rond vert ouvre WhatsApp. */
export function ProductCard({ product }: { product: PublicProduct }) {
  const wa = whatsappLink(product);
  const place = product.vendor.city ?? product.vendor.countryName;
  return (
    <article className="group relative flex w-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5 dark:ring-white/10">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff className="size-7" aria-hidden />
          </span>
        )}
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          {product.vendor.liveUrl ? (
            <span className="rounded-[4px] bg-[#FE2C55] px-1.5 py-[3px] text-[10px] leading-none font-bold tracking-wider text-white">LIVE</span>
          ) : (
            <span />
          )}
          {product.kind === "service" && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ocd-black backdrop-blur">Prestation</span>
          )}
        </div>
      </div>

      <Link href={`/marketplace/${product.id}`} className="absolute inset-0 z-[1] rounded-2xl" aria-label={`${product.title}, ${priceLabel(product)}`} />

      <div className="mt-3 flex flex-1 flex-col">
        <p className="truncate text-xs text-muted-foreground">
          {product.vendor.businessName} · {place}
        </p>
        <p className="mt-1 line-clamp-2 text-[15px] leading-snug font-medium">{product.title}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className={cn("font-semibold whitespace-nowrap", product.price === null && "text-sm font-medium text-muted-foreground")}>{priceLabel(product)}</p>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contacter ${product.vendor.businessName} sur WhatsApp`}
              className="relative z-[2] inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:scale-105 hover:brightness-95"
            >
              <WhatsAppIcon className="size-[18px]" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: PublicProduct[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.id} className="flex">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
