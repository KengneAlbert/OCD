import Link from "next/link";
import { Marquee } from "@/components/brand/broadcast";
import { siteConfig } from "@/config/site";

const items = [
  "Lancement le 1er décembre",
  "Premiers créneaux limités",
  "Au studio à Lomé",
  "Ou à distance, partout dans le monde",
  "Réserve ton live",
];

/** Bandeau défilant façon chaîne d'info. */
export function LaunchBanner() {
  if (!siteConfig.showLaunchBanner) return null;
  return (
    <Link href="/reserver" className="block bg-ocd-black text-white" aria-label="Lancement le 1er décembre, premiers créneaux limités : réserver mon live">
      <Marquee className="h-9 font-mono text-[11px] tracking-[0.2em] uppercase">
        {items.map((t) => (
          <span key={t} className="flex items-center gap-6 pr-6">
            <span aria-hidden className="size-1.5 rounded-full bg-ocd-orange" />
            {t}
          </span>
        ))}
      </Marquee>
    </Link>
  );
}
