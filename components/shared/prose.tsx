import type { ReactNode } from "react";

/** Mise en forme des pages de texte (mentions légales, confidentialité). */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-4 leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-accent-text [&_a]:underline [&_a]:underline-offset-4 [&_h2]:scroll-mt-24 [&_h2]:pt-6 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_h3]:pt-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:space-y-1.5">
      {children}
    </div>
  );
}
