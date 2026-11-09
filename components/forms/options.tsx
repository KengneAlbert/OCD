import { categories, OTHER_CATEGORY_ID, productCountOptions } from "@/config/categories";
import { countries, countryGroups } from "@/config/countries";
import type { SelectOption } from "@/components/ui/select-menu";
import { MoreHorizontal } from "lucide-react";

/** Drapeau emoji à partir du code ISO (ex. « TG » → 🇹🇬). */
export function flagEmoji(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function Flag({ code }: { code: string }) {
  return (
    <span aria-hidden className="flex size-6 items-center justify-center rounded-full bg-muted text-base leading-none">
      {flagEmoji(code)}
    </span>
  );
}

const groupLabel = new Map(countryGroups.map((g) => [g.region, g.label]));

/** Pays groupés par région ; `withDial` affiche l'indicatif (+228) à droite. */
export function countryOptions(withDial = false): SelectOption[] {
  return countryGroups.flatMap((g) =>
    countries
      .filter((c) => c.region === g.region)
      .map((c) => ({
        value: c.code,
        label: c.name,
        leading: <Flag code={c.code} />,
        short: withDial ? c.dialCode : undefined,
        group: groupLabel.get(c.region),
        keywords: `${c.code} ${c.dialCode}`,
      })),
  );
}

function CategoryIcon({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span aria-hidden className="flex size-8 items-center justify-center rounded-full bg-ocd-orange/15 text-ocd-orange-dark dark:text-ocd-orange">
      <Icon className="size-4" />
    </span>
  );
}

export const categoryOptions: SelectOption[] = [
  ...categories.map((c) => ({
    value: c.id,
    label: c.label,
    description: c.examples,
    leading: <CategoryIcon icon={c.icon} />,
  })),
  {
    value: OTHER_CATEGORY_ID,
    label: "Autre activité",
    description: "Tu préciseras juste après",
    leading: <CategoryIcon icon={MoreHorizontal} />,
  },
];

export const productCountSelectOptions: SelectOption[] = productCountOptions.map((o) => ({ value: o.value, label: o.label }));
