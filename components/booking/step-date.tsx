"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { scheduleConfig } from "@/config/schedule";
import { formatDateFr, getBookingWindow, getSlotsForDate, isDateBookable } from "@/lib/schedule";
import { BookingCalendar, type DayHint } from "./booking-calendar";
import { useBooking } from "./booking-provider";
import { StepShell } from "./step-shell";

/** En dessous de ce nombre de créneaux libres, on affiche « plus que N ». */
const FEW_SLOTS = 2;

export function StepDate() {
  const { state, setDate, update, now } = useBooking();
  const bookingWindow = useMemo(() => getBookingWindow(now), [now]);

  // Créneaux déjà pris sur toute la fenêtre de réservation (un seul appel). Silencieux si l'API échoue.
  const [taken, setTaken] = useState<Map<string, Set<string>> | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/availability?from=${bookingWindow.start}&to=${bookingWindow.end}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { taken: [] }))
      .then((json: { taken?: { date: string; slotStart: string }[] }) => {
        const map = new Map<string, Set<string>>();
        for (const t of json.taken ?? []) map.set(t.date, (map.get(t.date) ?? new Set()).add(t.slotStart));
        setTaken(map);
      })
      .catch(() => setTaken(new Map()));
    return () => ctrl.abort();
  }, [bookingWindow.start, bookingWindow.end]);

  /** Nombre de créneaux encore réservables ce jour-là. */
  const freeSlots = useCallback(
    (date: string) => {
      const busy = taken?.get(date);
      return getSlotsForDate(date, now).filter((s) => s.available && !busy?.has(s.start)).length;
    },
    [taken, now],
  );

  const isDisabled = useCallback((date: string) => !isDateBookable(date, now) || (taken !== null && freeSlots(date) === 0), [now, taken, freeSlots]);

  const getHint = useCallback(
    (date: string): DayHint | undefined => {
      if (taken === null || !isDateBookable(date, now)) return undefined;
      const free = freeSlots(date);
      if (free === 0) return { label: "Complet", tone: "full" };
      if (free <= FEW_SLOTS) return { label: `plus que ${free}`, short: String(free), tone: "few" };
      return undefined;
    },
    [taken, now, freeSlots],
  );

  // La date choisie vient d'être complétée par d'autres clients : on la retire.
  useEffect(() => {
    if (state.date && taken !== null && isDateBookable(state.date, now) && freeSlots(state.date) === 0) update({ date: undefined, slotStart: undefined });
  }, [state.date, taken, now, freeSlots, update]);

  return (
    <StepShell
      title="Choisis la date de ton live"
      description={`Réservations ouvertes du ${formatDateFr(bookingWindow.start)} au ${formatDateFr(bookingWindow.end)}. Le studio est ouvert du lundi au samedi.`}
    >
      <BookingCalendar
        value={state.date}
        onChange={setDate}
        isDisabled={isDisabled}
        getHint={getHint}
        minDate={bookingWindow.start}
        maxDate={bookingWindow.end}
      />
      <p aria-live="polite" className="flex items-center gap-2 text-sm">
        {state.date ? (
          <>
            <CalendarCheck className="size-5 text-accent-text" aria-hidden />
            <span>
              Date choisie : <strong className="capitalize">{formatDateFr(state.date)}</strong>
              {(() => {
                const free = taken === null ? null : freeSlots(state.date);
                return free !== null && free <= FEW_SLOTS ? (
                  <span className="ml-2 font-semibold text-ocd-orange-dark dark:text-ocd-orange">
                    · plus que {free} créneau{free > 1 ? "x" : ""} libre{free > 1 ? "s" : ""}
                  </span>
                ) : null;
              })()}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Sélectionne un jour disponible ({scheduleConfig.timezoneLabel}).</span>
        )}
      </p>
    </StepShell>
  );
}
