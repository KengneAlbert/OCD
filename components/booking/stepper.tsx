"use client";

import { Check } from "lucide-react";
import { BOOKING_STEPS } from "@/lib/booking";
import { cn } from "@/lib/utils";
import { useBooking } from "./booking-provider";

export function Stepper() {
  const { state, goTo } = useBooking();
  const current = state.step;
  const total = BOOKING_STEPS.length;
  const progress = ((current + 1) / total) * 100;

  return (
    <nav aria-label="Étapes de la réservation" className="space-y-3">
      <div className="flex items-baseline justify-between text-sm sm:hidden">
        <span className="font-mono text-[11px] tracking-[0.15em] uppercase">{BOOKING_STEPS[current]?.label}</span>
        <span className="text-muted-foreground">
          Étape {current + 1} sur {total}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Progression de la réservation"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-valuetext={`Étape ${current + 1} sur ${total} : ${BOOKING_STEPS[current]?.label}`}
        className="h-2 overflow-hidden rounded-full bg-ocd-cream sm:hidden dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-ocd-orange shadow-[0_0_12px_rgb(255_217_160)] transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="hidden items-center gap-2 sm:flex">
        {BOOKING_STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const content = (
            <>
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition",
                  done && "border-ocd-orange bg-ocd-orange text-ocd-black",
                  active && "border-ocd-orange bg-card text-foreground shadow-[0_0_0_4px_rgb(255_217_160/0.6)]",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className={cn("font-mono text-[11px] tracking-[0.15em] uppercase", active ? "text-foreground" : "text-muted-foreground")}>{step.short}</span>
            </>
          );
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              {done ? (
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className="flex items-center gap-2 rounded-full pr-2"
                  aria-label={`Revenir à l'étape ${i + 1} : ${step.label}`}
                >
                  {content}
                </button>
              ) : (
                <span className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
                  {content}
                </span>
              )}
              {i < total - 1 && (
                <span aria-hidden className={cn("h-0.5 flex-1 rounded-full", done ? "bg-ocd-orange" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
