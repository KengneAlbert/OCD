"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateFr, parseDateKey, toDateKey } from "@/lib/schedule";
import { cn } from "@/lib/utils";

/** Indication sous le numéro du jour (jour complet, peu de créneaux libres). */
export interface DayHint {
  label: string;
  /** Version courte pour les petits écrans. */
  short?: string;
  tone: "few" | "full";
}

interface BookingCalendarProps {
  value?: string;
  onChange: (date: string) => void;
  isDisabled: (date: string) => boolean;
  getHint?: (date: string) => DayHint | undefined;
  minDate: string;
  maxDate: string;
}

const WEEK = { weekStartsOn: 1 as const };

/**
 * Calendrier mensuel en français, navigable au clavier (motif ARIA « grid ») :
 * flèches = jour/semaine, Début/Fin = début/fin de semaine, Page préc./suiv. = mois.
 */
export function BookingCalendar({ value, onChange, isDisabled, getHint, minDate, maxDate }: BookingCalendarProps) {
  const captionId = useId();
  const firstEnabled = useMemo(() => {
    let d = parseDateKey(minDate);
    const max = parseDateKey(maxDate);
    while (d <= max) {
      const key = toDateKey(d);
      if (!isDisabled(key)) return key;
      d = addDays(d, 1);
    }
    return minDate;
  }, [minDate, maxDate, isDisabled]);

  const initial = value ?? firstEnabled;
  const [focused, setFocused] = useState(initial);
  const [month, setMonth] = useState(() => startOfMonth(parseDateKey(initial)));
  const shouldFocus = useRef(false);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (shouldFocus.current) {
      buttons.current.get(focused)?.focus();
      shouldFocus.current = false;
    }
  }, [focused, month]);

  const minMonth = startOfMonth(parseDateKey(minDate));
  const maxMonth = startOfMonth(parseDateKey(maxDate));
  const canPrev = month > minMonth;
  const canNext = month < maxMonth;

  const days = eachDayOfInterval({ start: startOfWeek(month, WEEK), end: endOfWeek(endOfMonth(month), WEEK) });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const inRange = (key: string) => key >= minDate && key <= maxDate;

  // Jour qui reçoit le tabindex=0 (« roving tabindex »).
  const tabbable = (() => {
    if (isSameMonth(parseDateKey(focused), month)) return focused;
    if (value && isSameMonth(parseDateKey(value), month)) return value;
    const firstInMonth = days.find((d) => isSameMonth(d, month) && inRange(toDateKey(d)) && !isDisabled(toDateKey(d)));
    return firstInMonth ? toDateKey(firstInMonth) : toDateKey(month);
  })();

  const moveFocus = (target: Date) => {
    let key = toDateKey(target);
    if (key < minDate) key = minDate;
    if (key > maxDate) key = maxDate;
    const d = parseDateKey(key);
    shouldFocus.current = true;
    setFocused(key);
    if (!isSameMonth(d, month)) setMonth(startOfMonth(d));
  };

  const changeMonth = (delta: number) => {
    const m = addMonths(month, delta);
    setMonth(m);
    const first = eachDayOfInterval({ start: m, end: endOfMonth(m) })
      .map(toDateKey)
      .find((k) => inRange(k) && !isDisabled(k));
    if (first) setFocused(first);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, day: Date) => {
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(day, -1),
      ArrowRight: () => addDays(day, 1),
      ArrowUp: () => addDays(day, -7),
      ArrowDown: () => addDays(day, 7),
      Home: () => startOfWeek(day, WEEK),
      End: () => endOfWeek(day, WEEK),
      PageUp: () => addMonths(day, -1),
      PageDown: () => addMonths(day, 1),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      moveFocus(fn());
    }
  };

  const monthLabel = format(month, "MMMM yyyy", { locale: fr });

  return (
    <div className="rounded-3xl border border-border bg-card p-4 glow-card sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={!canPrev}
          aria-label="Mois précédent"
          className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-ocd-cream disabled:opacity-30 dark:hover:bg-white/5"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <h3 id={captionId} aria-live="polite" className="font-display text-lg font-bold capitalize">
          {monthLabel}
        </h3>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          disabled={!canNext}
          aria-label="Mois suivant"
          className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-ocd-cream disabled:opacity-30 dark:hover:bg-white/5"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <table role="grid" aria-labelledby={captionId} className="w-full table-fixed border-separate border-spacing-1">
        <thead>
          <tr>
            {weeks[0]?.map((d) => (
              <th key={d.toISOString()} scope="col" abbr={format(d, "EEEE", { locale: fr })} className="pb-2 text-xs font-semibold text-muted-foreground uppercase">
                {format(d, "EEEEEE", { locale: fr })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]!.toISOString()}>
              {week.map((day) => {
                const key = toDateKey(day);
                if (!isSameMonth(day, month)) return <td key={key} role="gridcell" aria-hidden />;
                const disabled = !inRange(key) || isDisabled(key);
                const selected = key === value;
                const hint = inRange(key) ? getHint?.(key) : undefined;
                const hintText = hint?.tone === "full" ? ", complet" : hint ? `, ${hint.label} créneaux libres` : "";
                return (
                  <td key={key} role="gridcell" aria-selected={selected}>
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) buttons.current.set(key, el);
                        else buttons.current.delete(key);
                      }}
                      tabIndex={key === tabbable ? 0 : -1}
                      aria-disabled={disabled || undefined}
                      aria-label={`${formatDateFr(key)}${hintText || (disabled ? ", indisponible" : "")}${selected ? ", sélectionnée" : ""}`}
                      onClick={() => {
                        setFocused(key);
                        if (!disabled) onChange(key);
                      }}
                      onKeyDown={(e) => onKeyDown(e, day)}
                      className={cn(
                        "relative flex aspect-square w-full flex-col items-center justify-center rounded-xl text-sm font-semibold transition sm:text-base",
                        disabled && hint?.tone !== "full" && "cursor-not-allowed text-muted-foreground/50 line-through decoration-1",
                        hint?.tone === "full" && "cursor-not-allowed bg-muted/60 text-muted-foreground/60",
                        !disabled && !selected && "bg-ocd-cream hover:bg-ocd-glow/60 dark:bg-white/5 dark:hover:bg-ocd-orange/20",
                        selected && "bg-ocd-orange text-ocd-black shadow-[0_0_0_3px_rgb(255_217_160),0_8px_20px_-6px_rgb(232_121_43/0.7)]",
                      )}
                    >
                      <span className={cn(hint && "-mt-1.5 sm:-mt-2")}>{format(day, "d")}</span>
                      {hint && (
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-x-0.5 bottom-1 truncate text-center leading-none font-semibold no-underline",
                            "text-[8px] sm:bottom-1.5 sm:text-[10px]",
                            hint.tone === "full" ? "text-muted-foreground" : selected ? "text-ocd-black" : "text-ocd-orange-dark dark:text-ocd-orange",
                          )}
                        >
                          {hint.tone === "few" && hint.short ? (
                            <>
                              <span className="sm:hidden">{hint.short} dispo</span>
                              <span className="hidden sm:inline">{hint.label}</span>
                            </>
                          ) : (
                            hint.label
                          )}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded bg-ocd-cream ring-1 ring-border dark:bg-white/10" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded bg-ocd-orange" /> Ta date
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded bg-transparent ring-1 ring-border" /> Fermé
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded bg-muted ring-1 ring-border" /> Complet
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="text-[10px] font-bold text-ocd-orange-dark dark:text-ocd-orange">2</span> Derniers créneaux
        </span>
      </div>
    </div>
  );
}
