import type { ScheduleConfig } from "@/types";

/**
 * Planning du studio OCD Live.
 * Créneaux générés automatiquement : dayStart → dayEnd, durée + battement.
 * Avec la config ci-dessous : 08:00–09:30, 10:00–11:30, 12:00–13:30,
 * 14:00–15:30, 16:00–17:30, 18:00–19:30, 20:00–21:30.
 */
export const scheduleConfig: ScheduleConfig = {
  timezone: "Africa/Lome",
  timezoneLabel: "heure de Lomé (GMT)",
  utcOffsetMinutes: 0,

  openingDate: "2026-12-01",
  bookingHorizonDays: 60,

  // 0 = dimanche, 1 = lundi … 6 = samedi. Ici : du lundi au samedi.
  workingDays: [1, 2, 3, 4, 5, 6],
  closedDates: [
    "2026-12-25", // Noël
    "2027-01-01", // Jour de l'an
    "2027-01-13", // Fête de la libération nationale (Togo)
  ],

  dayStart: "08:00",
  dayEnd: "21:30",
  slotDurationMinutes: 90,
  bufferMinutes: 30,
  minNoticeMinutes: 120,

  // Exemple : { "2026-12-01": ["10:00"] } — prêt à être alimenté par une base de données.
  unavailableSlots: {},
};
