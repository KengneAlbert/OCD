/**
 * Fonctions PURES de planning : génération des créneaux, dates réservables,
 * formatage en français et conversion de fuseau horaire.
 * Toutes acceptent `now` et la config en paramètre → faciles à tester.
 */
import { addDays, format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { scheduleConfig as defaultConfig } from "@/config/schedule";
import type { ScheduleConfig, TimeSlot } from "@/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isDateKey(value: string): boolean {
  return DATE_RE.test(value) && isValid(parseISO(value));
}

export function isTimeKey(value: string): boolean {
  return TIME_RE.test(value);
}

export function timeToMinutes(time: string): number {
  if (!isTimeKey(time)) throw new Error(`Heure invalide : ${time}`);
  const [h, m] = time.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type SlotRules = Pick<ScheduleConfig, "dayStart" | "dayEnd" | "slotDurationMinutes" | "bufferMinutes">;

/** Génère les créneaux d'une journée type (sans disponibilité). */
export function generateDailySlots(config: SlotRules = defaultConfig): Omit<TimeSlot, "available">[] {
  const { slotDurationMinutes: duration, bufferMinutes: buffer } = config;
  if (duration <= 0) throw new Error("La durée d'un créneau doit être positive.");
  if (buffer < 0) throw new Error("Le battement ne peut pas être négatif.");

  const slots: Omit<TimeSlot, "available">[] = [];
  const limit = timeToMinutes(config.dayEnd);
  let cursor = timeToMinutes(config.dayStart);

  while (cursor + duration <= limit) {
    const start = minutesToTime(cursor);
    slots.push({ id: start, start, end: minutesToTime(cursor + duration) });
    cursor += duration + buffer;
  }
  return slots;
}

/** Heure de fin d'un créneau à partir de son heure de début. */
export function getSlotEnd(start: string, config: SlotRules = defaultConfig): string | undefined {
  return generateDailySlots(config).find((s) => s.start === start)?.end;
}

/* ─── Dates ─────────────────────────────────────────────────────────────── */

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** "2026-12-01" → Date locale à minuit (pour les calculs de calendrier). */
export function parseDateKey(key: string): Date {
  return parseISO(key);
}

function studioShifted(now: Date, config: ScheduleConfig): Date {
  return new Date(now.getTime() + config.utcOffsetMinutes * 60_000);
}

/** Date du jour au studio (yyyy-MM-dd). */
export function getStudioToday(now: Date, config: ScheduleConfig = defaultConfig): string {
  return studioShifted(now, config).toISOString().slice(0, 10);
}

/** Minutes écoulées depuis minuit au studio. */
export function getStudioNowMinutes(now: Date, config: ScheduleConfig = defaultConfig): number {
  const s = studioShifted(now, config);
  return s.getUTCHours() * 60 + s.getUTCMinutes();
}

/** Fenêtre de réservation : du premier jour ouvert jusqu'à l'horizon. */
export function getBookingWindow(now: Date, config: ScheduleConfig = defaultConfig): { start: string; end: string } {
  const today = getStudioToday(now, config);
  const start = today > config.openingDate ? today : config.openingDate;
  const end = toDateKey(addDays(parseDateKey(start), config.bookingHorizonDays - 1));
  return { start, end };
}

/** Jour ouvré et non fermé (sans tenir compte de la fenêtre). */
export function isDateOpen(date: string, config: ScheduleConfig = defaultConfig): boolean {
  if (!isDateKey(date)) return false;
  const weekday = parseDateKey(date).getDay();
  return config.workingDays.includes(weekday) && !config.closedDates.includes(date);
}

/** Créneaux d'une date avec leur disponibilité. */
export function getSlotsForDate(date: string, now: Date, config: ScheduleConfig = defaultConfig): TimeSlot[] {
  const blocked = new Set(config.unavailableSlots[date] ?? []);
  const today = getStudioToday(now, config);
  const nowMinutes = getStudioNowMinutes(now, config);

  return generateDailySlots(config).map((slot) => {
    const tooSoon = date === today && timeToMinutes(slot.start) < nowMinutes + config.minNoticeMinutes;
    const past = date < today;
    return { ...slot, available: !blocked.has(slot.start) && !tooSoon && !past };
  });
}

export function isDateBookable(date: string, now: Date, config: ScheduleConfig = defaultConfig): boolean {
  if (!isDateKey(date)) return false;
  const { start, end } = getBookingWindow(now, config);
  if (date < start || date > end) return false;
  if (!isDateOpen(date, config)) return false;
  return getSlotsForDate(date, now, config).some((s) => s.available);
}

export function isSlotBookable(date: string, slotStart: string, now: Date, config: ScheduleConfig = defaultConfig): boolean {
  if (!isDateBookable(date, now, config)) return false;
  return getSlotsForDate(date, now, config).some((s) => s.start === slotStart && s.available);
}

/* ─── Formatage français ───────────────────────────────────────────────── */

/** "2026-12-01" → « mardi 1er décembre 2026 ». */
export function formatDateFr(date: string): string {
  const d = parseDateKey(date);
  const day = d.getDate();
  return `${format(d, "EEEE", { locale: fr })} ${day === 1 ? "1er" : day} ${format(d, "MMMM yyyy", { locale: fr })}`;
}

/** "10:00" → « 10h00 ». */
export function formatTimeFr(time: string): string {
  const [h, m] = time.split(":");
  return `${h}h${m}`;
}

/** « 10h00 – 11h30 ». */
export function formatSlotFr(start: string, end: string): string {
  return `${formatTimeFr(start)} – ${formatTimeFr(end)}`;
}

/* ─── Fuseaux horaires ─────────────────────────────────────────────────── */

/** Instant UTC correspondant à une date + heure du studio. */
export function studioTimeToUtc(date: string, time: string, config: ScheduleConfig = defaultConfig): Date {
  const [y, mo, d] = date.split("-").map(Number) as [number, number, number];
  const [h, mi] = time.split(":").map(Number) as [number, number];
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - config.utcOffsetMinutes * 60_000);
}

/** Date (yyyy-MM-dd) et heure (HH:mm) d'un instant dans un fuseau donné. */
export function partsInTimeZone(instant: Date, timeZone: string): { dateKey: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "00";
  return { dateKey: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

function dayDiff(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split("-").map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(a) - toUtc(b)) / 86_400_000);
}

export interface ConvertedSlot {
  start: string;
  end: string;
  /** -1 = la veille, 0 = même jour, +1 = le lendemain (dans le fuseau du visiteur). */
  dayOffset: number;
  sameAsStudio: boolean;
}

/** Convertit un créneau du studio dans le fuseau du visiteur. */
export function convertSlotToTimeZone(
  date: string,
  start: string,
  end: string,
  timeZone: string,
  config: ScheduleConfig = defaultConfig,
): ConvertedSlot {
  const s = partsInTimeZone(studioTimeToUtc(date, start, config), timeZone);
  const e = partsInTimeZone(studioTimeToUtc(date, end, config), timeZone);
  const dayOffset = dayDiff(s.dateKey, date);
  return { start: s.time, end: e.time, dayOffset, sameAsStudio: s.time === start && dayOffset === 0 };
}

/** "America/New_York" → « New York ». */
export function timeZoneCity(timeZone: string): string {
  return (timeZone.split("/").pop() ?? timeZone).replace(/_/g, " ");
}
