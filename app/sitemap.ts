import type { MetadataRoute } from "next";
import { categories } from "@/config/live-categories";
import { countries } from "@/config/countries";
import { siteConfig } from "@/config/site";
import { countrySlug } from "@/lib/lives";
import { getSettings } from "@/lib/settings";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { recrutementOuvert } = await getSettings();
  const routes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/reserver", priority: 0.9, changeFrequency: "weekly" },
    { path: "/live", priority: 0.9, changeFrequency: "weekly" },
    { path: "/marketplace", priority: 0.8, changeFrequency: "weekly" },
    { path: "/packages", priority: 0.9, changeFrequency: "monthly" },
    { path: "/comment-ca-marche", priority: 0.7, changeFrequency: "monthly" },
    { path: "/studio", priority: 0.7, changeFrequency: "monthly" },
    ...(recrutementOuvert ? [{ path: "/recrutement", priority: 0.6, changeFrequency: "monthly" as const }] : []),
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" },
    { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly" },
  ];
  const lastModified = new Date();
  // Pages pays et catégories de l'annuaire (pays mis en avant).
  for (const c of countries.filter((c) => c.region === "afrique-prioritaire")) {
    const base = `/live/${countrySlug(c.code)}`;
    routes.push({ path: base, priority: 0.7, changeFrequency: "weekly" });
    for (const cat of categories) routes.push({ path: `${base}/${cat.slug}`, priority: 0.5, changeFrequency: "weekly" });
  }
  return routes.map((r) => ({ url: `${siteConfig.url}${r.path}`, lastModified, changeFrequency: r.changeFrequency, priority: r.priority }));
}
