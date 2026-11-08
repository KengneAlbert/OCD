"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getPackage } from "@/config/packages";
import { SUMMARY_STEP, firstInvalidStep, validateStep } from "@/lib/booking";
import { clientProvider, usesEmail } from "@/lib/notifications/provider";
import { isSlotBookable } from "@/lib/schedule";
import { STORAGE_KEYS, readSession, removeSession, writeSession } from "@/lib/storage";
import type { BookingState, LiveType } from "@/types";

interface BookingContextValue {
  state: BookingState;
  hydrated: boolean;
  now: Date;
  error: string | null;
  emailRequired: boolean;
  setLiveType: (liveType: LiveType) => void;
  setDate: (date: string) => void;
  update: (patch: Partial<BookingState>) => void;
  /** Valide l'étape courante (après fusion du patch) puis avance. */
  next: (patch?: Partial<BookingState>) => void;
  back: () => void;
  goTo: (step: number, fromSummary?: boolean) => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

const initialState: BookingState = { step: 0 };
const emailRequired = usesEmail(clientProvider);

function isLiveType(value: string | null): value is LiveType {
  return value === "presentiel" || value === "distance";
}

/** Retire les choix devenus incohérents (package incompatible, créneau indisponible). */
function sanitize(state: BookingState, now: Date): BookingState {
  const next = { ...state };
  const pkg = getPackage(next.packageId);
  if (pkg && next.liveType && !pkg.compatibleWith.includes(next.liveType)) next.packageId = undefined;
  if (next.date && next.slotStart && !isSlotBookable(next.date, next.slotStart, now)) next.slotStart = undefined;
  return next;
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<BookingState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  // Restauration depuis sessionStorage + type présélectionné (?type=presentiel|distance).
  useEffect(() => {
    let restored = readSession<BookingState>(STORAGE_KEYS.booking) ?? initialState;
    const queryType = searchParams.get("type");
    if (isLiveType(queryType)) {
      restored = { ...restored, liveType: queryType, step: 1, editingFromSummary: false };
    }
    restored = sanitize(restored, now);
    const invalid = firstInvalidStep(restored, now, emailRequired) ?? SUMMARY_STEP;
    restored.step = Math.min(Math.max(restored.step ?? 0, 0), invalid);
    setState(restored);
    setHydrated(true);
    if (queryType) router.replace(pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated) writeSession(STORAGE_KEYS.booking, state);
  }, [state, hydrated]);

  const update = useCallback(
    (patch: Partial<BookingState>) => {
      setError(null);
      setState((s) => sanitize({ ...s, ...patch }, now));
    },
    [now],
  );

  const setLiveType = useCallback((liveType: LiveType) => update({ liveType }), [update]);
  const setDate = useCallback((date: string) => update({ date }), [update]);

  const next = useCallback(
    (patch: Partial<BookingState> = {}) => {
      const merged = sanitize({ ...state, ...patch }, now);
      const message = validateStep(merged.step, merged, now, emailRequired);
      if (message) {
        setError(message);
        setState(merged);
        return;
      }
      setError(null);
      const target = merged.editingFromSummary
        ? (firstInvalidStep(merged, now, emailRequired) ?? SUMMARY_STEP)
        : Math.min(merged.step + 1, SUMMARY_STEP);
      setState({ ...merged, step: target, editingFromSummary: target === SUMMARY_STEP ? false : merged.editingFromSummary });
    },
    [state, now],
  );

  const back = useCallback(() => {
    setError(null);
    setState((s) => ({ ...s, step: Math.max(s.step - 1, 0) }));
  }, []);

  const goTo = useCallback((step: number, fromSummary = false) => {
    setError(null);
    setState((s) => ({ ...s, step, editingFromSummary: fromSummary }));
  }, []);

  const reset = useCallback(() => {
    removeSession(STORAGE_KEYS.booking);
    setState(initialState);
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({ state, hydrated, now, error, emailRequired, setLiveType, setDate, update, next, back, goTo, setError, reset }),
    [state, hydrated, now, error, setLiveType, setDate, update, next, back, goTo, reset],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking doit être utilisé dans <BookingProvider>.");
  return ctx;
}
