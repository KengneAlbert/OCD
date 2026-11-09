/**
 * Construction des messages WhatsApp — fonctions PURES (testées dans /tests).
 */
import { getCategoryLabel, getProductCountLabel } from "@/config/categories";
import { getCountry } from "@/config/countries";
import { getPackage } from "@/config/packages";
import { formatDateFr, formatSlotFr } from "@/lib/schedule";
import { digitsOnly, formatPrice } from "@/lib/utils";
import type { Candidature, Reservation } from "@/types";

const EMPTY = "—";

const or = (value: string | undefined | null): string => (value && value.trim() ? value.trim() : EMPTY);

/** « +228 90 12 34 56 » à partir du code pays et du numéro saisi. */
export function formatPhone(countryCode: string, number: string): string {
  const dial = getCountry(countryCode)?.dialCode ?? "";
  return `${dial} ${number.trim()}`.trim();
}

export function formatLiveType(reservation: Pick<Reservation, "liveType" | "info">): string {
  if (reservation.liveType === "presentiel") return "Présentiel (studio OCD Live, Lomé)";
  const country = getCountry(reservation.info.country)?.name ?? reservation.info.country;
  return `À distance (${[country, reservation.info.city].filter(Boolean).join(", ")})`;
}

export function formatSocials(info: Pick<Reservation["info"], "tiktok" | "facebook" | "instagram">): string {
  const parts = [
    info.tiktok && `TikTok : ${info.tiktok}`,
    info.facebook && `Facebook : ${info.facebook}`,
    info.instagram && `Instagram : ${info.instagram}`,
  ].filter(Boolean);
  return parts.length ? parts.join(" | ") : EMPTY;
}

/** Message récapitulatif d'une réservation, prêt pour WhatsApp. */
export function buildReservationMessage(reservation: Reservation): string {
  const { info } = reservation;
  const pkg = getPackage(reservation.packageId);
  const productCount = getProductCountLabel(info.productCount);
  const products = productCount ? `${info.productDescription.trim()} (${productCount})` : info.productDescription.trim();

  return [
    "🎥 *NOUVELLE RÉSERVATION OCD LIVE*",
    "",
    `👤 Nom : ${info.fullName.trim()}`,
    `🏪 Business : ${info.businessName.trim()} (catégorie : ${getCategoryLabel(info.category, info.categoryOther)})`,
    `📦 Produit(s) présenté(s) : ${products}`,
    `📍 Type : ${formatLiveType(reservation)}`,
    `📅 Date : ${formatDateFr(reservation.date)}`,
    `⏰ Créneau : ${formatSlotFr(reservation.slotStart, reservation.slotEnd)} (heure de Lomé)`,
    `🎁 Package : ${pkg?.name ?? reservation.packageId} — Prix : ${pkg ? formatPrice(pkg.price) : EMPTY}`,
    `📞 Téléphone / WhatsApp : ${formatPhone(info.phoneCountry, info.phoneNumber)}`,
    `✉️ Email : ${or(info.email)}`,
    `🏠 Adresse de la boutique : ${or(info.shopAddress)}`,
    `🌐 Réseaux sociaux : ${formatSocials(info)}`,
    `📝 Message : ${or(info.specialNeeds)}`,
    "",
    `Réf : ${reservation.reference}`,
  ].join("\n");
}

/** Message de candidature animatrice / assistante live. */
export function buildCandidatureMessage(candidature: Candidature): string {
  const d = candidature.data;
  const languages = [...d.languages, ...(d.otherLanguages ? [d.otherLanguages] : [])].join(", ");
  const experience = d.hasSalesExperience === "oui" ? `Oui — ${or(d.experienceDetails)}` : "Non";

  return [
    "👩🏾‍💼 *CANDIDATURE ANIMATRICE OCD LIVE*",
    "",
    `👤 Nom : ${d.fullName.trim()}`,
    `🎂 Âge : ${d.age} ans`,
    `📍 Quartier / Ville : ${d.location.trim()}`,
    `📞 WhatsApp : ${formatPhone(d.phoneCountry, d.phoneNumber)}`,
    ...(d.email ? [`📧 Email : ${d.email.trim()}`] : []),
    `🗣️ Langues parlées : ${languages}`,
    `💼 Expérience de vente : ${experience}`,
    `🎬 Vidéo de présentation : ${or(d.videoUrl)}`,
    `🕒 Disponibilités : ${d.availability.join(", ")}`,
    `💬 Motivation : ${d.motivation.trim()}`,
    "",
    `Réf : ${candidature.reference}`,
  ].join("\n");
}

/** Lien wa.me avec message encodé. */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  return `https://wa.me/${digitsOnly(phoneNumber)}?text=${encodeURIComponent(message)}`;
}
