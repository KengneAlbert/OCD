"use client";

import Link from "next/link";
import { packages } from "@/config/packages";
import { PackageCard } from "@/components/packages/package-card";
import { useBooking } from "./booking-provider";
import { StepShell } from "./step-shell";

export function StepPackage() {
  const { state, update } = useBooking();

  // Les packages compatibles avec le type de live choisi d'abord.
  const sorted = [...packages].sort((a, b) => {
    const ca = state.liveType && a.compatibleWith.includes(state.liveType) ? 0 : 1;
    const cb = state.liveType && b.compatibleWith.includes(state.liveType) ? 0 : 1;
    return ca - cb;
  });

  return (
    <StepShell
      title="Choisis ton package"
      description={
        <>
          Prix en FCFA, payé en ligne par Mobile Money au moment de réserver.{" "}
          <Link href="/packages#comparatif" target="_blank" className="font-medium text-accent-text underline underline-offset-4">
            Comparer les packages
          </Link>
        </>
      }
    >
      <fieldset>
        <legend className="sr-only">Package</legend>
        <div className="grid gap-4 md:grid-cols-2">
          {sorted.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              selectable
              liveType={state.liveType}
              checked={state.packageId === pkg.id}
              onSelect={() => update({ packageId: pkg.id })}
            />
          ))}
        </div>
      </fieldset>
    </StepShell>
  );
}
