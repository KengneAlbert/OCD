"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Info } from "lucide-react";
import { scheduleConfig } from "@/config/schedule";
import { convertSlotToTimeZone, formatDateFr, formatSlotFr, getSlotsForDate, timeZoneCity } from "@/lib/schedule";
import { useBooking } from "./booking-provider";
import { StepShell, optionCardClass } from "./step-shell";

export function StepSlot() {
  const { state, update, now } = useBooking();
  const [visitorTz, setVisitorTz] = useState<string | null>(null);

  // Fuseau du visiteur : uniquement côté navigateur.
  useEffect(() => {
    try {
      setVisitorTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setVisitorTz(null);
    }
  }, []);

  // Créneaux déjà réservés par d'autres clients (Supabase). Silencieux si l'API est indisponible.
  const [taken, setTaken] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!state.date) return;
    const ctrl = new AbortController();
    fetch(`/api/availability?from=${state.date}&to=${state.date}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { taken: [] }))
      .then((json: { taken?: { slotStart: string }[] }) => setTaken(new Set((json.taken ?? []).map((t) => t.slotStart))))
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [state.date]);

  const slots = useMemo(
    () => (state.date ? getSlotsForDate(state.date, now).map((s) => (taken.has(s.start) ? { ...s, available: false } : s)) : []),
    [state.date, now, taken],
  );

  // Si le créneau choisi vient d'être pris, on le désélectionne.
  useEffect(() => {
    if (state.slotStart && taken.has(state.slotStart)) update({ slotStart: undefined });
  }, [taken, state.slotStart, update]);
  const showConversion = state.liveType === "distance" && visitorTz && state.date;
  const sameZone =
    showConversion && slots[0] ? convertSlotToTimeZone(state.date!, slots[0].start, slots[0].end, visitorTz!).sameAsStudio : true;

  return (
    <StepShell
      title="À quelle heure ?"
      description={
        state.date ? (
          <>
            Créneaux de 1h30 le <strong className="text-foreground">{formatDateFr(state.date)}</strong>, en {scheduleConfig.timezoneLabel}.
          </>
        ) : undefined
      }
    >
      {showConversion && !sameZone && (
        <p className="flex gap-2 rounded-2xl bg-ocd-cream p-4 text-sm dark:bg-white/5">
          <Info className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
          <span>
            Tu sembles être à <strong>{timeZoneCity(visitorTz!)}</strong> : on affiche aussi l&apos;heure chez toi sous chaque créneau.
          </span>
        </p>
      )}

      <fieldset>
        <legend className="sr-only">Créneau horaire</legend>
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
          {slots.map((slot) => {
            const local =
              showConversion && !sameZone ? convertSlotToTimeZone(state.date!, slot.start, slot.end, visitorTz!) : null;
            return (
              <label key={slot.id} className={`${optionCardClass} flex-col gap-1 p-4`}>
                <input
                  type="radio"
                  name="slot"
                  value={slot.start}
                  disabled={!slot.available}
                  checked={state.slotStart === slot.start}
                  onChange={() => update({ slotStart: slot.start })}
                  className="sr-only"
                />
                <span className="flex items-center gap-2 font-display text-lg font-bold">
                  <Clock className="size-4 text-accent-text" aria-hidden />
                  {formatSlotFr(slot.start, slot.end)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {slot.available ? "Heure de Lomé (GMT)" : "Complet"}
                </span>
                {local && slot.available && (
                  <span className="mt-1 text-sm font-medium text-accent-text">
                    Chez toi : {formatSlotFr(local.start, local.end)}
                    {local.dayOffset !== 0 && ` (${local.dayOffset > 0 ? "lendemain" : "veille"})`}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden className="size-2 rounded-full bg-whatsapp" />
        Les créneaux déjà réservés sont marqués « Complet ».
      </p>
    </StepShell>
  );
}
