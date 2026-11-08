import type { FaqItem } from "@/types";

/** Accordéon FAQ éditorial basé sur <details> : accessible et sans JavaScript. */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="border-t border-foreground/15">
      {items.map((item) => (
        <details key={item.question} className="group border-b border-foreground/15">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-xl font-medium tracking-tight transition-colors hover:text-accent-text sm:text-2xl [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <span
              aria-hidden
              className="relative mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-foreground/20 transition-all duration-300 group-open:rotate-45 group-open:border-ocd-orange group-open:bg-ocd-orange"
            >
              <span className="absolute h-px w-3 bg-current" />
              <span className="absolute h-3 w-px bg-current" />
            </span>
          </summary>
          <p className="max-w-2xl pb-7 text-lg leading-relaxed text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
