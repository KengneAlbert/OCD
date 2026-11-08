import { describe, expect, it } from "vitest";
import { scheduleConfig } from "@/config/schedule";
import {
  convertSlotToTimeZone,
  formatDateFr,
  formatSlotFr,
  generateDailySlots,
  getBookingWindow,
  getSlotsForDate,
  isDateBookable,
  isSlotBookable,
} from "@/lib/schedule";

const beforeLaunch = new Date("2026-11-08T10:00:00Z");

describe("generateDailySlots", () => {
  it("génère les 7 créneaux de 1h30 avec 30 min de battement", () => {
    expect(generateDailySlots(scheduleConfig).map((s) => `${s.start}-${s.end}`)).toEqual([
      "08:00-09:30",
      "10:00-11:30",
      "12:00-13:30",
      "14:00-15:30",
      "16:00-17:30",
      "18:00-19:30",
      "20:00-21:30",
    ]);
  });

  it("n'ajoute pas de créneau qui dépasserait la fin de journée", () => {
    const slots = generateDailySlots({ dayStart: "08:00", dayEnd: "11:00", slotDurationMinutes: 90, bufferMinutes: 30 });
    expect(slots).toHaveLength(1);
  });
});

describe("fenêtre de réservation", () => {
  it("commence au 1er décembre 2026 avant le lancement, sur 60 jours", () => {
    expect(getBookingWindow(beforeLaunch)).toEqual({ start: "2026-12-01", end: "2027-01-29" });
  });

  it("refuse les dates avant l'ouverture, les dimanches et les jours fermés", () => {
    expect(isDateBookable("2026-11-30", beforeLaunch)).toBe(false);
    expect(isDateBookable("2026-12-01", beforeLaunch)).toBe(true);
    expect(isDateBookable("2026-12-06", beforeLaunch)).toBe(false); // dimanche
    expect(isDateBookable("2026-12-25", beforeLaunch)).toBe(false); // Noël
    expect(isDateBookable("2027-02-15", beforeLaunch)).toBe(false); // hors horizon
  });

  it("bloque les créneaux indisponibles et ceux trop proches le jour même", () => {
    const config = { ...scheduleConfig, unavailableSlots: { "2026-12-02": ["10:00"] } };
    expect(isSlotBookable("2026-12-02", "10:00", beforeLaunch, config)).toBe(false);
    expect(isSlotBookable("2026-12-02", "12:00", beforeLaunch, config)).toBe(true);

    const sameDay = new Date("2026-12-03T09:30:00Z");
    const slots = getSlotsForDate("2026-12-03", sameDay);
    expect(slots.find((s) => s.start === "10:00")?.available).toBe(false);
    expect(slots.find((s) => s.start === "12:00")?.available).toBe(true);
  });
});

describe("formatage", () => {
  it("formate la date en français avec « 1er »", () => {
    expect(formatDateFr("2026-12-01")).toBe("mardi 1er décembre 2026");
    expect(formatDateFr("2026-12-14")).toBe("lundi 14 décembre 2026");
  });

  it("formate un créneau", () => {
    expect(formatSlotFr("10:00", "11:30")).toBe("10h00 – 11h30");
  });
});

describe("convertSlotToTimeZone", () => {
  it("convertit vers Paris (UTC+1 en décembre)", () => {
    expect(convertSlotToTimeZone("2026-12-01", "10:00", "11:30", "Europe/Paris")).toMatchObject({
      start: "11:00",
      end: "12:30",
      dayOffset: 0,
      sameAsStudio: false,
    });
  });

  it("signale le changement de jour (Tokyo)", () => {
    expect(convertSlotToTimeZone("2026-12-01", "20:00", "21:30", "Asia/Tokyo").dayOffset).toBe(1);
  });

  it("détecte un fuseau identique à Lomé (Abidjan)", () => {
    expect(convertSlotToTimeZone("2026-12-01", "10:00", "11:30", "Africa/Abidjan").sameAsStudio).toBe(true);
  });
});
