import { describe, expect, it } from "vitest";
import { parseCandidatureFilters, parseReservationFilters } from "@/lib/admin/filters";
import { renderSample } from "@/lib/emails/samples";
import { EMAIL_TEMPLATES, reservationReceivedEmail, toReservationView, type EmailTemplateId } from "@/lib/emails/templates";

describe("gabarits d'emails", () => {
  const ids = Object.keys(EMAIL_TEMPLATES) as EmailTemplateId[];

  it.each(ids)("%s : objet, HTML et texte brut", (id) => {
    const email = renderSample(id);
    expect(email.subject.length).toBeGreaterThan(5);
    expect(email.html.startsWith("<!doctype html>")).toBe(true);
    expect(email.html).toContain("OCD");
    expect(email.text.length).toBeGreaterThan(20);
    expect(email.text).not.toMatch(/undefined|\[object Object\]/);
    expect(email.html).not.toMatch(/undefined|\[object Object\]/);
  });

  it("échappe le HTML saisi par le client", () => {
    const view = toReservationView({
      reference: "OCD-ABC234",
      liveType: "distance",
      date: "2026-12-03",
      slotStart: "10:00",
      slotEnd: "11:30",
      packageId: "distance",
      fullName: `<script>alert("x")</script> Ama`,
      businessName: `Ama & Fils "<b>"`,
      phoneCountry: "CI",
      phoneNumber: "07 00 00 00",
      category: "mode",
      productDescription: "Pagnes",
      country: "CI",
      city: "Abidjan",
    });
    const { html } = reservationReceivedEmail(view);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Ama &amp; Fils");
    expect(html).toContain("Abidjan");
  });
});

describe("filtres de l'admin", () => {
  it("ignore les valeurs inconnues", () => {
    expect(parseReservationFilters({ status: "piratage", type: "x", from: "2026-13", page: "abc" })).toEqual({
      q: undefined,
      status: undefined,
      type: undefined,
      from: undefined,
      to: undefined,
      sort: "created",
      page: 1,
    });
  });

  it("garde les valeurs valides", () => {
    const f = parseReservationFilters({ status: "payee", type: "distance", from: "2026-12-01", sort: "live", page: "3" });
    expect(f).toMatchObject({ status: "payee", type: "distance", from: "2026-12-01", sort: "live", page: 3 });
    expect(parseCandidatureFilters({ status: "retenue" }).status).toBe("retenue");
  });
});
