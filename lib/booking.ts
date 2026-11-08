/**
 * Logique du tunnel de réservation (pure) : étapes, validation, construction
 * de l'objet Reservation final.
 */
import { getPackage } from "@/config/packages";
import { createInfoSchema, stepDateSchema, stepPackageSchema, stepSlotSchema, stepTypeSchema } from "@/lib/validation/reservation";
import { getSlotEnd, isDateBookable, isSlotBookable } from "@/lib/schedule";
import type { BookingState, Reservation } from "@/types";

export const BOOKING_STEPS = [
  { id: "type", label: "Type de live", short: "Type" },
  { id: "date", label: "Date", short: "Date" },
  { id: "slot", label: "Créneau", short: "Heure" },
  { id: "package", label: "Package", short: "Package" },
  { id: "info", label: "Tes informations", short: "Infos" },
  { id: "summary", label: "Récapitulatif", short: "Envoi" },
] as const;

export const SUMMARY_STEP = BOOKING_STEPS.length - 1;

/** Message d'erreur de l'étape, ou null si elle est valide. */
export function validateStep(step: number, state: BookingState, now: Date, emailRequired = false): string | null {
  switch (step) {
    case 0: {
      const r = stepTypeSchema.safeParse({ liveType: state.liveType });
      return r.success ? null : (r.error.issues[0]?.message ?? "Étape incomplète.");
    }
    case 1: {
      const r = stepDateSchema.safeParse({ date: state.date });
      if (!r.success) return r.error.issues[0]?.message ?? "Choisis une date.";
      return isDateBookable(r.data.date, now) ? null : "Cette date n'est plus disponible, choisis-en une autre.";
    }
    case 2: {
      const r = stepSlotSchema.safeParse({ slotStart: state.slotStart });
      if (!r.success) return r.error.issues[0]?.message ?? "Choisis un créneau.";
      return state.date && isSlotBookable(state.date, r.data.slotStart, now)
        ? null
        : "Ce créneau n'est plus disponible, choisis-en un autre.";
    }
    case 3: {
      const r = stepPackageSchema.safeParse({ packageId: state.packageId });
      if (!r.success) return r.error.issues[0]?.message ?? "Choisis un package.";
      const pkg = getPackage(r.data.packageId);
      return pkg && state.liveType && !pkg.compatibleWith.includes(state.liveType)
        ? "Ce package n'est pas disponible pour ce type de live."
        : null;
    }
    case 4: {
      const r = createInfoSchema({ liveType: state.liveType, emailRequired }).safeParse(state.info ?? {});
      return r.success ? null : "Complète tes informations.";
    }
    default:
      return null;
  }
}

/** Première étape invalide (0–4), ou null si tout est prêt pour le récapitulatif. */
export function firstInvalidStep(state: BookingState, now: Date, emailRequired = false): number | null {
  for (let step = 0; step < SUMMARY_STEP; step++) {
    if (validateStep(step, state, now, emailRequired)) return step;
  }
  return null;
}

/** Objet Reservation complet (ou null si une étape est incomplète). */
export function buildReservation(state: BookingState, reference: string, now: Date, emailRequired = false): Reservation | null {
  if (firstInvalidStep(state, now, emailRequired) !== null) return null;
  const info = createInfoSchema({ liveType: state.liveType, emailRequired }).parse(state.info);
  const slotEnd = getSlotEnd(state.slotStart!);
  if (!slotEnd) return null;
  return {
    reference,
    liveType: state.liveType!,
    date: state.date!,
    slotStart: state.slotStart!,
    slotEnd,
    packageId: state.packageId!,
    info,
    createdAt: now.toISOString(),
  };
}
