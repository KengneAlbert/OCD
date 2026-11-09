"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUMMARY_STEP } from "@/lib/booking";
import { useBooking } from "./booking-provider";
import { MobileRecap } from "./mobile-recap";
import { Stepper } from "./stepper";
import { StepDate } from "./step-date";
import { INFO_FORM_ID, StepInfo } from "./step-info";
import { StepPackage } from "./step-package";
import { StepSlot } from "./step-slot";
import { StepSummary } from "./step-summary";
import { StepType } from "./step-type";

const STEPS = [StepType, StepDate, StepSlot, StepPackage, StepInfo, StepSummary];

export function BookingWizard() {
  const { state, hydrated, error, next, back } = useBooking();
  const topRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef<number | null>(null);

  // À chaque changement d'étape : remonter en haut et placer le focus sur le titre.
  useEffect(() => {
    if (!hydrated) return;
    if (previousStep.current !== null && previousStep.current !== state.step) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => document.getElementById("booking-step-title")?.focus({ preventScroll: true }), 250);
    }
    previousStep.current = state.step;
  }, [state.step, hydrated]);

  if (!hydrated) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <div className="h-2 animate-pulse rounded-full bg-ocd-cream dark:bg-white/10" />
        <div className="h-9 w-2/3 animate-pulse rounded-xl bg-ocd-cream dark:bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-56 animate-pulse rounded-3xl bg-ocd-cream dark:bg-white/10" />
          <div className="h-56 animate-pulse rounded-3xl bg-ocd-cream dark:bg-white/10" />
        </div>
        <span className="sr-only">Chargement du formulaire de réservation…</span>
      </div>
    );
  }

  const Current = STEPS[state.step] ?? StepType;
  const isInfo = state.step === 4;
  const isSummary = state.step === SUMMARY_STEP;

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-8">
      <Stepper />

      <AnimatePresence mode="wait" initial={false}>
        <m.div
          key={state.step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <Current />
        </m.div>
      </AnimatePresence>

      <div aria-live="assertive">
        {error && (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </p>
        )}
      </div>

      {/* Barre d'actions : collée en bas de l'écran sur mobile. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <MobileRecap />
        <div className="flex items-center gap-3">
          {state.step > 0 && (
            <Button variant="outline" onClick={back} className="shrink-0">
              <ArrowLeft aria-hidden />
              Retour
            </Button>
          )}
          {!isSummary &&
            (isInfo ? (
              <Button type="submit" form={INFO_FORM_ID} className="flex-1 sm:ml-auto sm:flex-none sm:px-10">
                Voir le récapitulatif
                <ArrowRight aria-hidden />
              </Button>
            ) : (
              <Button onClick={() => next()} className="flex-1 sm:ml-auto sm:flex-none sm:px-10">
                Continuer
                <ArrowRight aria-hidden />
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
}
