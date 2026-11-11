import { describe, expect, it } from "vitest";
import {
  countryFromSlug,
  countrySlug,
  currentWindow,
  durationLabel,
  extendSubscription,
  isSubscriptionActive,
  liveExpiry,
  nextWindowLabel,
  nextWindowStart,
  normalizeHandle,
  parseLiveUrl,
} from "@/lib/lives";

const at = (hhmm: string) => new Date(`2026-12-02T${hhmm}:00Z`); // Lomé = UTC

describe("créneaux de validation (8h–11h, 18h–21h)", () => {
  it("ouverts pendant les créneaux", () => {
    expect(currentWindow(at("08:00"))).not.toBeNull();
    expect(currentWindow(at("10:59"))).not.toBeNull();
    expect(currentWindow(at("20:30"))).not.toBeNull();
  });
  it("fermés en dehors", () => {
    expect(currentWindow(at("07:59"))).toBeNull();
    expect(currentWindow(at("11:00"))).toBeNull();
    expect(currentWindow(at("15:00"))).toBeNull();
    expect(currentWindow(at("21:00"))).toBeNull();
  });
  it("annonce la prochaine ouverture", () => {
    expect(nextWindowLabel(at("12:00"))).toBe("aujourd'hui à 18h00");
    expect(nextWindowLabel(at("05:00"))).toBe("aujourd'hui à 8h00");
    expect(nextWindowLabel(at("22:00"))).toBe("demain à 8h00");
    expect(nextWindowStart(at("22:00")).toISOString()).toBe("2026-12-03T08:00:00.000Z");
  });
  it("compte à rebours lisible", () => {
    expect(durationLabel(nextWindowStart(at("15:46")).getTime() - at("15:46").getTime())).toBe("2h14");
    expect(durationLabel(14 * 60_000)).toBe("14 min");
  });
  it("un live reste affiché jusqu'à la fin du créneau + 1 h", () => {
    expect(liveExpiry(at("09:12"))?.toISOString()).toBe("2026-12-02T12:00:00.000Z");
    expect(liveExpiry(at("18:05"))?.toISOString()).toBe("2026-12-02T22:00:00.000Z");
    expect(liveExpiry(at("13:00"))).toBeNull();
  });
});

describe("liens de live TikTok", () => {
  it("TikTok : normalise profil et live", () => {
    expect(parseLiveUrl("https://www.tiktok.com/@Boutique.Ama/live?lang=fr")).toEqual({
      platform: "tiktok",
      handle: "boutique.ama",
      url: "https://www.tiktok.com/@boutique.ama/live",
    });
    expect(parseLiveUrl("tiktok.com/@ama_wax")?.url).toBe("https://www.tiktok.com/@ama_wax/live");
    expect(parseLiveUrl("https://vm.tiktok.com/ZMabc/")).toMatchObject({ platform: "tiktok", handle: null });
  });
  it("accepte le texte de partage complet", () => {
    expect(parseLiveUrl("Regarde mon live ! https://www.tiktok.com/@ama_wax/live")?.handle).toBe("ama_wax");
  });
  it("liens courts de partage", () => {
    expect(parseLiveUrl("https://vt.tiktok.com/ZSabc/")).toMatchObject({ platform: "tiktok", handle: null });
  });
  it("refuse Facebook, Instagram et YouTube", () => {
    expect(parseLiveUrl("https://fb.watch/abc123/")).toBeNull();
    expect(parseLiveUrl("https://www.instagram.com/ama/live/")).toBeNull();
    expect(parseLiveUrl("https://youtube.com/watch?v=abc")).toBeNull();
  });
  it("refuse les autres liens", () => {
    expect(parseLiveUrl("https://evil.com/@ama")).toBeNull();
    expect(parseLiveUrl("https://tiktok.com.evil.com/@ama")).toBeNull();
    expect(parseLiveUrl("https://www.tiktok.com/@ama/video/123")).toBeNull();
    expect(parseLiveUrl("https://vm.tiktok.com/")).toBeNull();
    expect(parseLiveUrl("pas un lien")).toBeNull();
  });
  it("nettoie un identifiant", () => {
    expect(normalizeHandle("@Ama.Wax")).toBe("ama.wax");
    expect(normalizeHandle("https://www.tiktok.com/@ama_wax/live")).toBe("ama_wax");
    expect(normalizeHandle("a")).toBeNull();
  });
});

describe("pages pays", () => {
  it("adresse lisible aller-retour", () => {
    expect(countrySlug("CI")).toBe("cote-d-ivoire");
    expect(countryFromSlug("cote-d-ivoire")?.code).toBe("CI");
    expect(countryFromSlug("rd-congo")?.code).toBe("CD");
    expect(countryFromSlug("atlantide")).toBeUndefined();
  });
});

describe("abonnement", () => {
  const now = new Date("2026-12-01T10:00:00Z");
  it("actif seulement avant la date de fin", () => {
    expect(isSubscriptionActive("2026-12-05T00:00:00Z", now)).toBe(true);
    expect(isSubscriptionActive("2026-11-30T00:00:00Z", now)).toBe(false);
    expect(isSubscriptionActive(null, now)).toBe(false);
  });
  it("prolonge de 30 jours, à partir de la fin si encore active", () => {
    expect(extendSubscription(null, now).toISOString()).toBe("2026-12-31T10:00:00.000Z");
    expect(extendSubscription("2026-12-10T00:00:00Z", now).toISOString()).toBe("2027-01-09T00:00:00.000Z");
  });
});
