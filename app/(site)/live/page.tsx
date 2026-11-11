import type { Metadata } from "next";
import { AutoRefresh } from "@/components/lives/auto-refresh";
import { CountryList, EmptyLives, LiveGrid, SubscribeCta } from "@/components/lives/directory";
import { MyCountry } from "@/components/lives/my-country";
import { ValidationStatus } from "@/components/lives/validation-status";
import { livesConfig } from "@/config/lives";
import { getLivesNow } from "@/lib/db/lives";
import { visitorCountry } from "@/lib/visitor";

export const metadata: Metadata = {
  title: "Lives business en direct en Afrique",
  description: "Trouve les vendeurs de ton pays en live maintenant sur TikTok.",
  alternates: { canonical: "/live" },
};
export const dynamic = "force-dynamic";

export default async function LiveIndexPage() {
  const now = new Date();
  const [data, mine] = await Promise.all([getLivesNow(now), visitorCountry()]);
  const mineCount = data.countries.find((c) => c.code === mine)?.count ?? 0;
  const all = [...data.featured, ...data.lives];
  const nCountries = data.countries.length;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pt-14">
      <AutoRefresh seconds={livesConfig.refreshSeconds} />

      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[clamp(2.4rem,6vw,4.25rem)] leading-[1] font-semibold tracking-tight">Lives en direct</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {data.total
              ? `${data.total} vendeur${data.total > 1 ? "s" : ""} en live sur TikTok, dans ${nCountries} pays.`
              : "Les vendeurs de ton pays, en live sur TikTok."}
          </p>
        </div>
        <ValidationStatus serverNow={now.toISOString()} />
      </header>

      <div className="mt-10">
        <MyCountry code={mine} count={mineCount} />
      </div>

      {data.total === 0 ? (
        <div className="mt-12">
          <EmptyLives now={now} />
        </div>
      ) : (
        <>
          <section className="mt-14">
            <h2 className="mb-5 text-xl font-semibold tracking-tight">Par pays</h2>
            <CountryList countries={data.countries} />
          </section>

          <section className="mt-14">
            <h2 className="mb-5 text-xl font-semibold tracking-tight">En direct maintenant</h2>
            <LiveGrid lives={all} />
          </section>
        </>
      )}

      <div className="mt-20">
        <SubscribeCta />
      </div>
    </div>
  );
}
