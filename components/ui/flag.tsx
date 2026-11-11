import { cn } from "@/lib/utils";

/**
 * Drapeau d'un pays (SVG 3:2 dans public/flags, copiés depuis country-flag-icons par `npm run flags`).
 * Remplace les émojis drapeaux, qui s'affichent en lettres sur Windows.
 */
export function Flag({ code, className, label }: { code: string; className?: string; label?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- petit SVG statique, pas besoin d'optimisation
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      width={24}
      height={16}
      loading="lazy"
      decoding="async"
      className={cn("inline-block aspect-[3/2] h-4 w-auto shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.08)]", className)}
    />
  );
}
