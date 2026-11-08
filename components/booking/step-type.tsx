"use client";

import { CheckCircle2, Globe2, Mic } from "lucide-react";
import type { LiveType } from "@/types";
import { useBooking } from "./booking-provider";
import { StepShell, optionCardClass } from "./step-shell";

export const liveTypeOptions: {
  value: LiveType;
  title: string;
  subtitle: string;
  points: string[];
  icon: typeof Mic;
}[] = [
  {
    value: "presentiel",
    title: "En présentiel au studio",
    subtitle: "Lomé, Togo",
    points: ["Tu viens au studio avec tes produits", "Une régie pro dirige ton live", "Décor, lumière et son inclus"],
    icon: Mic,
  },
  {
    value: "distance",
    title: "À distance",
    subtitle: "Depuis chez toi ou ta boutique",
    points: [
      "Tu fais ton live depuis n'importe quel pays",
      "Une assistante OCD t'accompagne depuis le studio",
      "Test de connexion avant le jour J",
    ],
    icon: Globe2,
  },
];

export function StepType() {
  const { state, setLiveType } = useBooking();

  return (
    <StepShell title="Quel type de live veux-tu faire ?" description="Choisis la formule qui te correspond. Tu pourras changer plus tard.">
      <fieldset>
        <legend className="sr-only">Type de live</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {liveTypeOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <label key={opt.value} className={`${optionCardClass} flex-col gap-4`}>
                <input
                  type="radio"
                  name="liveType"
                  value={opt.value}
                  checked={state.liveType === opt.value}
                  onChange={() => setLiveType(opt.value)}
                  className="peer sr-only"
                />
                <CheckCircle2 aria-hidden className="absolute top-5 right-5 size-6 text-ocd-orange-dark opacity-0 transition peer-checked:opacity-100" />
                <span className="flex size-14 items-center justify-center rounded-2xl bg-ocd-orange/15 text-accent-text">
                  <Icon className="size-7" aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-xl font-bold">{opt.title}</span>
                  <span className="block text-sm font-medium text-accent-text">{opt.subtitle}</span>
                </span>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {opt.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ocd-orange" />
                      {p}
                    </li>
                  ))}
                </ul>
              </label>
            );
          })}
        </div>
      </fieldset>

      {state.liveType === "distance" && (
        <p className="rounded-2xl border border-ocd-orange/30 bg-ocd-glow/25 p-4 text-sm dark:bg-ocd-orange/10">
          <strong>Bon à savoir :</strong> pendant ton live, une assistante OCD Live t&apos;accompagne en direct depuis le studio de
          Lomé. Elle anime, lit les commentaires et rappelle ton numéro à ton public.
        </p>
      )}
    </StepShell>
  );
}
