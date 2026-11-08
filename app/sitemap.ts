import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/reserver", priority: 0.9, changeFrequency: "weekly" },
    { path: "/packages", priority: 0.9, changeFrequency: "monthly" },
    { path: "/comment-ca-marche", priority: 0.7, changeFrequency: "monthly" },
    { path: "/studio", priority: 0.7, changeFrequency: "monthly" },
    { path: "/recrutement", priority: 0.6, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
    { path: "/mentions-legales", priority: 0.2, changeFrequency: "yearly" },
    { path: "/confidentialite", priority: 0.2, changeFrequency: "yearly" },
  ];
  const lastModified = new Date();
  return routes.map((r) => ({ url: `${siteConfig.url}${r.path}`, lastModified, changeFrequency: r.changeFrequency, priority: r.priority }));
}
