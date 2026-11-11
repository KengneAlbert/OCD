import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AutoRefresh } from "@/components/lives/auto-refresh";
import { CategoryTiles, EmptyLives, LiveCount, LiveGrid, SubscribeCta } from "@/components/lives/directory";
import { ShareButton } from "@/components/lives/share-button";
import { ValidationStatus } from "@/components/lives/validation-status";
import { Flag } from "@/components/ui/flag";
import { livesConfig } from "@/config/lives";
import { getLivesNow } from "@/lib/db/lives";
import { countryFromSlug, countrySlug, inCountry } from "@/lib/lives";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ pays: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = countryFromSlug((await params).pays);
  if (!country) return {};
  return {
    title: `Lives business en direct ${inCountry(country.name)}`,
    description: `Les vendeurs en live maintenant ${inCountry(country.name)} : nourriture, mode, beauté, électronique… Rejoins-les en un tap.`,
    alternates: { canonical: `/live/${countrySlug(country.code)}` },
  };
}

export default async function CountryLivesPage({ params }: Props) {
  const country = countryFromSlug((await params).pays);
  if (!country) notFound();
  const now = new Date();
  const data = await getLivesNow(now);
  const featured = data.featured.filter((l) => l.country === country.code);
  const lives = data.lives.filter((l) => l.country === country.code);
  const counts = new Map<string, number>();
  for (const l of lives) counts.set(l.category, (counts.get(l.category) ?? 0) + 1);
  const total = featured.length + lives.length;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-8 sm:pt-12">
      <AutoRefresh seconds={livesConfig.refreshSeconds} />
      <Link href="/live" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Tous les pays
      </Link>

      <header className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-5">
          <Flag code={country.code} className="h-14 rounded-lg sm:h-16" />
          <div>
            <h1 className="text-[clamp(2.2rem,5.5vw,3.75rem)] leading-[1] font-semibold tracking-tight">{country.name}</h1>
            <LiveCount n={total} className="mt-2 text-base" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ValidationStatus serverNow={now.toISOString()} />
          <ShareButton text={`Les vendeurs en live maintenant ${inCountry(country.name)}`} path={`/live/${countrySlug(country.code)}`} className="h-11 px-5 text-sm" />
        </div>
      </header>

      {featured.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">À la une</h2>
          <LiveGrid lives={featured} />
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-5 text-xl font-semibold tracking-tight">Catégories</h2>
        <CategoryTiles country={country.code} counts={counts} />
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-xl font-semibold tracking-tight">En direct maintenant</h2>
        {lives.length ? <LiveGrid lives={lives} /> : <EmptyLives now={now} backHref="/live" backLabel="Autres pays" />}
      </section>

      <div className="mt-20">
        <SubscribeCta />
      </div>
    </div>
  );
}
