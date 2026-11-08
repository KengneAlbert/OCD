import type { ReactNode } from "react";
import { Chyron, Viewfinder } from "@/components/brand/broadcast";
import { cn } from "@/lib/utils";

/** En-tête éditorial des pages intérieures. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden px-3 sm:px-5", className)}>
      <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-14 sm:px-8 sm:pt-24 sm:pb-20">
        <Viewfinder />
        <div aria-hidden className="absolute -top-10 right-0 h-80 w-80 animate-breathe rounded-full bg-ocd-glow/60 blur-3xl dark:bg-ocd-orange/15" />
        <div className="relative">
          {eyebrow && <Chyron className="fade-up">{eyebrow}</Chyron>}
          <h1 className="mt-6 max-w-5xl text-[clamp(2.6rem,7.5vw,6.5rem)] leading-[0.95] font-semibold">
            <span className="reveal-line">
              <span>{title}</span>
            </span>
          </h1>
          {description && (
            <p className="fade-up mt-8 max-w-xl text-lg text-muted-foreground sm:ml-auto sm:text-xl" style={{ animationDelay: "0.2s" }}>
              {description}
            </p>
          )}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  center = false,
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  center?: boolean;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-6 sm:py-28", className)}>
      {(eyebrow || title || description) && (
        <div className={cn("mb-12 sm:mb-16", center ? "mx-auto max-w-3xl text-center" : "grid gap-6 lg:grid-cols-12 lg:items-end")}>
          <div className={center ? "" : "lg:col-span-7"}>
            {eyebrow && <Chyron>{eyebrow}</Chyron>}
            {title && <h2 className="mt-5 text-4xl leading-[1] font-semibold sm:text-6xl">{title}</h2>}
          </div>
          {description && (
            <p className={cn("text-lg text-muted-foreground", center ? "mt-5" : "lg:col-span-4 lg:col-start-9")}>{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
