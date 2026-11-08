import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  orange: { root: "bg-ocd-orange text-ocd-black", chip: "bg-ocd-black text-white" },
  dark: { root: "bg-ocd-black text-white dark:bg-white dark:text-ocd-black", chip: "bg-ocd-orange text-ocd-black" },
  light: { root: "bg-white text-ocd-black", chip: "bg-ocd-black text-white" },
  outline: {
    root: "border border-ocd-black/15 bg-transparent text-foreground hover:border-ocd-black dark:border-white/20 dark:hover:border-white",
    chip: "bg-ocd-black text-white dark:bg-white dark:text-ocd-black",
  },
};

/** Lien-bouton pilule avec pastille fléchée qui pivote au survol. */
export function PillLink({
  href,
  children,
  variant = "orange",
  size = "lg",
  className,
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: "md" | "lg";
  className?: string;
  external?: boolean;
}) {
  const v = variants[variant];
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "group inline-flex items-center justify-between gap-4 rounded-full font-semibold transition-[transform,background-color,border-color] duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 active:translate-y-0",
        size === "lg" ? "h-16 pr-2 pl-7 text-base sm:text-lg" : "h-12 pr-1.5 pl-5 text-sm",
        v.root,
        className,
      )}
    >
      <span>{children}</span>
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-45",
          size === "lg" ? "size-12" : "size-9",
          v.chip,
        )}
      >
        <ArrowUpRight className={size === "lg" ? "size-5" : "size-4"} />
      </span>
    </Link>
  );
}
