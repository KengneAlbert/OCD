import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AutoRefresh } from "@/components/lives/auto-refresh";
import { EmptyLives, LiveCount, LiveGrid, SubscribeCta } from "@/components/lives/directory";
import { ShareButton } from "@/components/lives/share-button";
import { Flag } from "@/components/ui/flag";
import { getCategory } from "@/config/live-categories";
import { livesConfig } from "@/config/lives";
import { getLivesNow } from "@/lib/db/lives";
import { countryFromSlug, countrySlug, inCountry } from "@/lib/lives";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ pays: string; categorie: string }> };

async function resolve(params: Props["params"]) {
  const p = await params;
  const country = countryFromSlug(p.pays);
  const category = getCategory(p.categorie);
  return country && category ? { country, category } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await resolve(params);
  if (!r) return {};
  return {
    title: `Lives business ${inCountry(r.country.name)} – ${r.category.label}`,
    description: `${r.category.label} : les vendeurs en live maintenant ${inCountry(r.country.name)}. Regarde et commande sur WhatsApp.`,
    alternates: { canonical: `/live/${countrySlug(r.country.code)}/${r.category.slug}` },
  };
}

export default async function CategoryLivesPage({ params }: Props) {
  const r = await resolve(params);
  if (!r) notFound();
  const { country, category } = r;
  const now = new Date();
  const data = await getLivesNow(now);
  const lives = data.lives.filter((l) => l.country === country.code && l.category === category.slug);
  const path = `/live/${countrySlug(country.code)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-8 sm:pt-12">
      <AutoRefresh seconds={livesConfig.refreshSeconds} />
      <Link href={path} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        <Flag code={country.code} className="h-3.5 rounded-[2px]" />
        {country.name}
      </Link>

      <header className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[clamp(2.2rem,5.5vw,3.75rem)] leading-[1] font-semibold tracking-tight">{category.label}</h1>
          <LiveCount n={lives.length} className="mt-2 text-base" />
        </div>
        <ShareButton text={`${category.label} : les vendeurs en live ${inCountry(country.name)}`} path={`${path}/${category.slug}`} className="h-11 w-fit px-5 text-sm" />
      </header>

      <div className="mt-10">{lives.length ? <LiveGrid lives={lives} /> : <EmptyLives now={now} backHref={path} backLabel="Autres catégories" />}</div>

      <div className="mt-20">
        <SubscribeCta />
      </div>
    </div>
  );
}
