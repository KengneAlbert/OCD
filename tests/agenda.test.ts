import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/agenda";

const base = {
  reference: "OCD-AB12CD",
  liveType: "presentiel" as const,
  date: "2026-12-04",
  slotStart: "18:00",
  slotEnd: "19:30",
  packageName: "Live Découverte",
  businessName: "Boutique Ama, pagnes; wax",
  url: "https://ocdlive.com/paiement/abc",
};

describe("buildIcs", () => {
  const ics = buildIcs(base, new Date("2026-11-09T10:00:00Z"));

  it("produit un VEVENT valide en UTC (Lomé = GMT)", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("DTSTART:20261204T180000Z");
    expect(ics).toContain("DTEND:20261204T193000Z");
    expect(ics).toContain("UID:ocd-ab12cd@ocdlive");
  });

  it("échappe les virgules et points-virgules", () => {
    expect(ics.replace(/\r\n /g, "")).toContain("Boutique Ama\\, pagnes\\; wax");
  });

  it("plie les lignes à 75 octets", () => {
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
  });

  it("adapte le lieu et le rappel au type de live", () => {
    expect(ics).toContain("TRIGGER:-PT1H30M");
    const remote = buildIcs({ ...base, liveType: "distance" });
    expect(remote).toContain("LOCATION:En ligne");
    expect(remote).toContain("TRIGGER:-PT1H");
  });
});
