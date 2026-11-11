import Link from "next/link";
import { Rec } from "@/components/brand/broadcast";
import { siteConfig } from "@/config/site";
import { whatsappLink } from "@/lib/utils";

const columns = [
  {
    title: "Réserver",
    links: [
      { href: "/reserver?type=presentiel", label: "Live au studio" },
      { href: "/reserver?type=distance", label: "Live à distance" },
      { href: "/packages", label: "Packages & prix" },
      { href: "/comment-ca-marche", label: "Comment ça marche" },
    ],
  },
  {
    title: "OCD Live",
    links: [
      { href: "/live", label: "Lives en direct" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/je-suis-en-live", label: "Je suis en live" },
      { href: "/moi", label: "Espace vendeur" },
      { href: "/studio", label: "Le studio" },
      { href: "/recrutement", label: "Recrutement" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Infos",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/mentions-legales#conditions", label: "Conditions" },
      { href: "/confidentialite", label: "Confidentialité" },
    ],
  },
];

/** `recrutementOuvert` : sans recrutement en cours, le lien « Recrutement » est retiré. */
export function Footer({ recrutementOuvert = true }: { recrutementOuvert?: boolean }) {
  const { studio } = siteConfig;
  return (
    <footer className="relative overflow-hidden bg-ocd-black text-white">
      <div className="mx-auto max-w-6xl px-5 pt-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="space-y-6">
            <Rec label="En direct de Lomé" className="text-white/60" />
            <p className="max-w-sm text-2xl leading-snug font-medium tracking-tight">
              Le marketing <span className="accent text-ocd-orange">avant</span> la vente.
            </p>
            <address className="space-y-1.5 text-sm text-white/60 not-italic">
              <p>
                {studio.name} — {studio.street}, {studio.city}, {studio.country}
              </p>
              <p>
                <a href={`tel:+${siteConfig.whatsappNumber}`} className="hover:text-white">
                  {siteConfig.phoneDisplay}
                </a>{" "}
                ·{" "}
                <a href={`mailto:${siteConfig.email}`} className="hover:text-white">
                  {siteConfig.email}
                </a>
              </p>
              <p>
                <a href={whatsappLink(siteConfig.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="text-ocd-orange hover:underline">
                  Écrire sur WhatsApp →
                </a>
              </p>
            </address>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="mb-4 font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">{col.title}</h2>
                <ul className="space-y-2.5">
                  {col.links.filter((l) => recrutementOuvert || l.href !== "/recrutement").map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-white/80 transition hover:text-ocd-orange">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <div>
              <h2 className="mb-4 font-mono text-[11px] tracking-[0.2em] text-white/40 uppercase">Réseaux</h2>
              <ul className="space-y-2.5">
                {siteConfig.socials.map((s) => (
                  <li key={s.name}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-white/80 transition hover:text-ocd-orange">
                      {s.name} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Logotype géant */}
      <div aria-hidden className="mt-16 flex items-end justify-center overflow-hidden px-2 leading-[0.78] select-none">
        <span className="text-[27vw] font-bold tracking-[-0.06em] text-ocd-orange lg:text-[19rem]">OCD</span>
        <span className="accent ml-[2vw] text-[25vw] text-white lg:text-[17.5rem]">live</span>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 pb-24 font-mono text-[11px] tracking-[0.15em] text-white/50 uppercase sm:flex-row sm:justify-between sm:px-6 sm:pb-6">
          <p>© {new Date().getFullYear()} OCD Live · Lomé, Togo</p>
          <p>Le marketing avant la vente</p>
        </div>
      </div>
    </footer>
  );
}
