import Link from "next/link";
import { Check, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { optionCardClass } from "@/components/booking/step-shell";
import { cn, formatPrice } from "@/lib/utils";
import type { LivePackage, LiveType } from "@/types";

const compatLabel = (pkg: LivePackage) =>
  pkg.compatibleWith.length === 2 ? "Présentiel ou à distance" : pkg.compatibleWith[0] === "presentiel" ? "Au studio, à Lomé" : "À distance";

function PackageBody({ pkg }: { pkg: LivePackage }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {pkg.popular && (
          <Badge variant="orange" className="shadow-[0_0_14px_rgb(255_217_160)]">
            ★ Populaire
          </Badge>
        )}
        <Badge variant="outline">{compatLabel(pkg)}</Badge>
      </div>
      <div>
        <h3 className="font-display text-xl font-bold">{pkg.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{pkg.tagline}</p>
      </div>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-3xl font-extrabold">{formatPrice(pkg.price)}</span>
        {pkg.originalPrice && (
          <span className="text-sm text-muted-foreground">
            au lieu de <s>{formatPrice(pkg.originalPrice)}</s>
          </span>
        )}
      </p>
      <ul className="space-y-2 text-sm">
        {pkg.includes.map((item) => (
          <li key={item} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Carte package : version vitrine (lien) ou version sélectionnable (radio) dans le tunnel. */
export function PackageCard({
  pkg,
  selectable,
  checked,
  onSelect,
  liveType,
  className,
}: {
  pkg: LivePackage;
  selectable?: boolean;
  checked?: boolean;
  onSelect?: () => void;
  liveType?: LiveType;
  className?: string;
}) {
  if (selectable) {
    const incompatible = Boolean(liveType && !pkg.compatibleWith.includes(liveType));
    return (
      <label className={cn(optionCardClass, "flex-col gap-4", className)}>
        <input
          type="radio"
          name="package"
          value={pkg.id}
          checked={checked}
          disabled={incompatible}
          onChange={onSelect}
          className="peer sr-only"
        />
        <CheckCircle2 aria-hidden className="absolute top-5 right-5 size-6 text-ocd-orange-dark opacity-0 transition peer-checked:opacity-100" />
        <PackageBody pkg={pkg} />
        {incompatible && (
          <span className="text-sm font-medium text-muted-foreground">
            Disponible uniquement {pkg.compatibleWith[0] === "presentiel" ? "en présentiel" : "à distance"}.
          </span>
        )}
      </label>
    );
  }

  return (
    <article
      className={cn(
        "relative flex flex-col gap-4 rounded-3xl border bg-card p-6 glow-card",
        pkg.popular ? "border-ocd-orange glow-strong" : "border-border",
        className,
      )}
    >
      <PackageBody pkg={pkg} />
      <Button asChild variant={pkg.popular ? "default" : "outline"} className="mt-auto w-full">
        <Link href={`/reserver${pkg.compatibleWith.length === 1 ? `?type=${pkg.compatibleWith[0]}` : ""}`}>
          Choisir ce package
        </Link>
      </Button>
    </article>
  );
}
