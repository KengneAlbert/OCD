"use client";

import { useCallback, useMemo } from "react";
import { CalendarCheck } from "lucide-react";
import { scheduleConfig } from "@/config/schedule";
import { formatDateFr, getBookingWindow, isDateBookable } from "@/lib/schedule";
import { BookingCalendar } from "./booking-calendar";
import { useBooking } from "./booking-provider";
import { StepShell } from "./step-shell";

export function StepDate() {
  const { state, setDate, now } = useBooking();
  const bookingWindow = useMemo(() => getBookingWindow(now), [now]);
  const isDisabled = useCallback((date: string) => !isDateBookable(date, now), [now]);

  return (
    <StepShell
      title="Choisis la date de ton live"
      description={`Réservations ouvertes du ${formatDateFr(bookingWindow.start)} au ${formatDateFr(bookingWindow.end)}. Le studio est ouvert du lundi au samedi.`}
    >
      <BookingCalendar value={state.date} onChange={setDate} isDisabled={isDisabled} minDate={bookingWindow.start} maxDate={bookingWindow.end} />
      <p aria-live="polite" className="flex items-center gap-2 text-sm">
        {state.date ? (
          <>
            <CalendarCheck className="size-5 text-accent-text" aria-hidden />
            <span>
              Date choisie : <strong className="capitalize">{formatDateFr(state.date)}</strong>
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Sélectionne un jour disponible ({scheduleConfig.timezoneLabel}).</span>
        )}
      </p>
    </StepShell>
  );
}
