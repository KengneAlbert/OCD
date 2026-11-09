import { describe, expect, it } from "vitest";
import { generateReference, RESERVATION_REF_RE } from "@/lib/reference";
import { buildCandidatureMessage, buildReservationMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { createReservationSchema, emptyInfo } from "@/lib/validation/reservation";
import type { Candidature, Reservation } from "@/types";

const reservation: Reservation = {
  reference: "OCD-7KQ2MX",
  liveType: "distance",
  date: "2026-12-01",
  slotStart: "10:00",
  slotEnd: "11:30",
  packageId: "promo",
  createdAt: "2026-11-08T10:00:00.000Z",
  info: {
    ...emptyInfo,
    fullName: "Ama Koffi",
    businessName: "Ama Délices",
    category: "restauration",
    productDescription: "Jus de bissap et pâtisseries maison",
    phoneCountry: "CI",
    phoneNumber: "07 01 02 03 04",
    country: "CI",
    city: "Abidjan",
    tiktok: "@amadelices",
    productCount: "2-5",
    acceptTerms: true,
  },
};

describe("buildReservationMessage", () => {
  const message = buildReservationMessage(reservation);

  it("contient toutes les lignes attendues", () => {
    expect(message).toContain("🎥 *NOUVELLE RÉSERVATION OCD LIVE*");
    expect(message).toContain("👤 Nom : Ama Koffi");
    expect(message).toContain("🏪 Business : Ama Délices (catégorie : Restauration / Traiteur)");
    expect(message).toContain("📦 Produit(s) présenté(s) : Jus de bissap et pâtisseries maison (2 à 5 produits)");
    expect(message).toContain("📍 Type : À distance (Côte d'Ivoire, Abidjan)");
    expect(message).toContain("📅 Date : mardi 1er décembre 2026");
    expect(message).toContain("⏰ Créneau : 10h00 – 11h30");
    expect(message).toContain("🎁 Package : Pack Promo — Prix : 30 000 FCFA");
    expect(message).toContain("📞 Téléphone / WhatsApp : +225 07 01 02 03 04");
    expect(message).toContain("✉️ Email : —");
    expect(message).toContain("🌐 Réseaux sociaux : TikTok : @amadelices");
    expect(message.trim().endsWith("Réf : OCD-7KQ2MX")).toBe(true);
  });

  it("indique le présentiel à Lomé", () => {
    expect(buildReservationMessage({ ...reservation, liveType: "presentiel" })).toContain(
      "📍 Type : Présentiel (studio OCD Live, Lomé)",
    );
  });
});

describe("buildWhatsAppUrl", () => {
  it("encode le message et nettoie le numéro", () => {
    const url = buildWhatsAppUrl("+228 90 00 00 00", "Bonjour 🎥 & merci");
    expect(url).toBe(`https://wa.me/22890000000?text=${encodeURIComponent("Bonjour 🎥 & merci")}`);
  });
});

describe("generateReference", () => {
  it("respecte le format OCD-XXXXXX", () => {
    for (let i = 0; i < 50; i++) expect(generateReference()).toMatch(RESERVATION_REF_RE);
  });

  it("est déterministe avec un générateur injecté", () => {
    expect(generateReference("OCD", 6, () => [0, 1, 2, 3, 4, 5])).toBe("OCD-ABCDEF");
  });
});

describe("createReservationSchema", () => {
  it("valide une réservation complète", () => {
    expect(createReservationSchema().safeParse(reservation).success).toBe(true);
  });

  it("exige l'email en phase 2", () => {
    expect(createReservationSchema({ emailRequired: true }).safeParse(reservation).success).toBe(false);
  });

  it("refuse un package incompatible", () => {
    const r = createReservationSchema().safeParse({ ...reservation, packageId: "decouverte" });
    expect(r.success).toBe(false);
  });

  it("exige pays et ville à distance", () => {
    const r = createReservationSchema().safeParse({ ...reservation, info: { ...reservation.info, city: "" } });
    expect(r.success).toBe(false);
  });
});

describe("buildCandidatureMessage", () => {
  it("préfixe la candidature", () => {
    const candidature: Candidature = {
      reference: "CAND-ABC234",
      createdAt: "2026-11-08T10:00:00.000Z",
      data: {
        fullName: "Esi Mensah",
        age: "23",
        location: "Bè, Lomé",
        phoneCountry: "TG",
        phoneNumber: "90 11 22 33",
        email: "",
        languages: ["Français", "Éwé"],
        otherLanguages: "",
        hasSalesExperience: "oui",
        experienceDetails: "Vendeuse au marché",
        videoUrl: "",
        availability: ["Soir"],
        motivation: "J'adore parler et convaincre les clients.",
        acceptTerms: true,
      },
    };
    const msg = buildCandidatureMessage(candidature);
    expect(msg.startsWith("👩🏾‍💼 *CANDIDATURE ANIMATRICE OCD LIVE*")).toBe(true);
    expect(msg).toContain("💼 Expérience de vente : Oui — Vendeuse au marché");
    expect(msg).toContain("📞 WhatsApp : +228 90 11 22 33");
  });
});
