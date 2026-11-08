import { Check, Minus } from "lucide-react";
import { packages } from "@/config/packages";
import { cn, formatPrice } from "@/lib/utils";
import type { LivePackage } from "@/types";

const yes = (label = "Inclus") => (
  <>
    <Check className="mx-auto size-5 text-whatsapp" aria-hidden />
    <span className="sr-only">{label}</span>
  </>
);
const no = (
  <>
    <Minus className="mx-auto size-5 text-muted-foreground/50" aria-hidden />
    <span className="sr-only">Non inclus</span>
  </>
);

const rows: { label: string; render: (p: LivePackage) => React.ReactNode }[] = [
  {
    label: "Prix",
    render: (p) => (
      <span className="font-display font-bold whitespace-nowrap">
        {formatPrice(p.price)}
        {p.originalPrice && (
          <span className="block text-xs font-normal text-muted-foreground">
            au lieu de <s>{formatPrice(p.originalPrice)}</s>
          </span>
        )}
      </span>
    ),
  },
  { label: "Nombre de lives", render: (p) => p.livesLabel },
  {
    label: "Durée par live",
    render: (p) => `${Math.floor(p.liveDurationMinutes / 60)}h${String(p.liveDurationMinutes % 60).padStart(2, "0")}`,
  },
  { label: "Au studio (Lomé)", render: (p) => (p.compatibleWith.includes("presentiel") ? yes("Disponible") : no) },
  { label: "À distance", render: (p) => (p.compatibleWith.includes("distance") ? yes("Disponible") : no) },
  { label: "Régie ou assistante OCD", render: () => yes() },
  { label: "Numéro et adresse à l'écran", render: () => yes() },
  {
    label: "Vidéo promo",
    render: (p) =>
      p.features.promoVideo === "aucune" ? no : p.features.promoVideo === "avant-chaque-live" ? "Avant chaque live" : "Avant le live",
  },
  { label: "Mise en avant sur nos réseaux", render: (p) => (p.features.socialHighlight ? yes() : no) },
  { label: "Accompagnement personnalisé", render: (p) => (p.features.coaching ? yes() : no) },
  { label: "Priorité sur les créneaux", render: (p) => (p.features.priority ? yes() : no) },
];

/** Tableau comparatif des packages (défilement horizontal sur mobile). */
export function ComparisonTable() {
  return (
    <div className="relative">
      <p className="mb-3 text-sm text-muted-foreground sm:hidden">← Fais glisser le tableau pour tout voir →</p>
      <div className="overflow-x-auto rounded-3xl border border-border bg-card glow-card" tabIndex={0} role="region" aria-label="Tableau comparatif des packages">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <caption className="sr-only">Comparaison des 6 packages OCD Live</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="sticky left-0 z-10 w-48 bg-card p-4 text-left font-display text-base">
                Package
              </th>
              {packages.map((p) => (
                <th key={p.id} scope="col" className={cn("p-4 text-center align-bottom font-display text-base", p.popular && "bg-ocd-glow/30 dark:bg-ocd-orange/10")}>
                  {p.popular && <span className="mb-1 block text-xs font-bold text-accent-text">★ Populaire</span>}
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border last:border-0">
                <th scope="row" className="sticky left-0 z-10 bg-card p-4 text-left font-medium text-muted-foreground">
                  {row.label}
                </th>
                {packages.map((p) => (
                  <td key={p.id} className={cn("p-4 text-center", p.popular && "bg-ocd-glow/30 dark:bg-ocd-orange/10")}>
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
