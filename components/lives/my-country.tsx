"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin } from "lucide-react";
import { countryOptions } from "@/components/forms/options";
import { Flag } from "@/components/ui/flag";
import { SelectMenu } from "@/components/ui/select-menu";
import { getCountry } from "@/config/countries";
import { countrySlug } from "@/lib/lives";
import { LiveCount } from "./directory";

const COUNTRY_COOKIE = "ocd_pays"; // même nom que lib/visitor.ts

/** « Mon pays » : détecté automatiquement, modifiable (mémorisé dans un cookie). */
export function MyCountry({ code, count }: { code: string; count: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const country = getCountry(code);
  const href = `/live/${countrySlug(code)}`;

  const choose = (next: string) => {
    document.cookie = `${COUNTRY_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    setEditing(false);
    router.push(`/live/${countrySlug(next)}`);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-4">
          <Flag code={code} className="h-12 rounded-lg sm:h-14" />
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <MapPin className="size-3.5" aria-hidden /> Ton pays
            </span>
            <span className="mt-0.5 block truncate text-2xl font-semibold tracking-tight">{country?.name ?? code}</span>
            <LiveCount n={count} className="mt-0.5" />
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {editing ? (
            <div className="w-full sm:w-64">
              <SelectMenu id="mon-pays" name="pays" value={code} onChange={choose} options={countryOptions()} searchable />
            </div>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} className="h-11 rounded-full px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
                Changer
              </button>
              <Link href={href} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 sm:flex-none">
                Voir les lives <ArrowRight className="size-4" aria-hidden />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
