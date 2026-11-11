import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_COUNTRY_CODE, getCountry } from "@/config/countries";

export const COUNTRY_COOKIE = "ocd_pays";

/** Pays du visiteur : choix mémorisé, sinon en-tête géo de Vercel, sinon Togo. */
export async function visitorCountry(): Promise<string> {
  const saved = (await cookies()).get(COUNTRY_COOKIE)?.value?.toUpperCase();
  if (saved && getCountry(saved)) return saved;
  const geo = (await headers()).get("x-vercel-ip-country")?.toUpperCase();
  return geo && getCountry(geo) ? geo : DEFAULT_COUNTRY_CODE;
}
