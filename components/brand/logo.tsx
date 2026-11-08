import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Logo OCD Live. Remplacer /public/logo-ocd-live.svg par le fichier officiel :
 * aucun autre changement nécessaire. En mode sombre, le logo est posé sur une
 * « plaque » claire, comme sur le mur blanc du studio.
 */
export function Logo({
  className,
  href = "/",
  priority = false,
  size = "md",
}: {
  className?: string;
  href?: string | null;
  priority?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dims = { sm: [64, 40], md: [84, 52], lg: [132, 82], xl: [220, 137] }[size] as [number, number];
  const img = (
    <span className={cn("inline-flex rounded-xl dark:bg-white dark:px-2 dark:py-1", className)}>
      <Image src="/logo-ocd-live.svg" alt="OCD Live" width={dims[0]} height={dims[1]} priority={priority} unoptimized />
    </span>
  );
  if (!href) return img;
  return (
    <Link href={href} aria-label="OCD Live — accueil" className="inline-flex rounded-xl">
      {img}
    </Link>
  );
}
