import type { ReactNode } from "react";

/** Titre + description d'une étape. Le titre reçoit le focus à chaque changement d'étape. */
export function StepShell({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 id="booking-step-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none sm:text-4xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

/** Classe commune des cartes-options (radio natif caché, accessibles au clavier). */
export const optionCardClass =
  "relative flex cursor-pointer rounded-[1.75rem] border-2 border-border bg-card p-5 transition hover:border-ocd-orange/60 has-checked:border-ocd-orange has-checked:bg-ocd-cream/60 has-checked:shadow-[0_0_0_4px_rgb(255_217_160/0.55),0_20px_50px_-24px_rgb(232_121_43/0.6)] has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-ocd-orange-dark has-disabled:cursor-not-allowed has-disabled:opacity-55 has-disabled:hover:border-border dark:has-checked:bg-ocd-orange/10";
