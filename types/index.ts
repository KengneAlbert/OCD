import type { LucideIcon } from "lucide-react";

/* ─── Domaine ───────────────────────────────────────────────────────────── */

export type LiveType = "presentiel" | "distance";

export type PackageId =
  | "decouverte"
  | "distance"
  | "pack-4"
  | "promo"
  | "visibilite-plus"
  | "mensuel";

/** Canal d'envoi choisi via NOTIFICATION_PROVIDER. */
export type NotificationProvider = "whatsapp" | "brevo" | "both";

/* ─── Packages ──────────────────────────────────────────────────────────── */

export type PromoVideo = "aucune" | "avant-le-live" | "avant-chaque-live";

export interface PackageFeatures {
  promoVideo: PromoVideo;
  /** Numéro + adresse mis en avant sur les réseaux d'OCD Live. */
  socialHighlight: boolean;
  /** Accompagnement personnalisé (conseils vente, mise en scène). */
  coaching: boolean;
  /** Priorité sur les créneaux. */
  priority: boolean;
}

export interface LivePackage {
  id: PackageId;
  name: string;
  tagline: string;
  price: number;
  /** Prix barré (« au lieu de »). */
  originalPrice?: number;
  currency: "FCFA";
  liveDurationMinutes: number;
  /** null = lives réguliers sur le mois. */
  livesCount: number | null;
  livesLabel: string;
  includes: string[];
  compatibleWith: LiveType[];
  /** Mis en avant sur la page d'accueil. */
  highlighted: boolean;
  /** Badge « Populaire ». */
  popular: boolean;
  features: PackageFeatures;
}

/* ─── Planning ──────────────────────────────────────────────────────────── */

export interface ScheduleConfig {
  /** Fuseau IANA du studio. */
  timezone: string;
  timezoneLabel: string;
  /** Décalage UTC du studio en minutes (Lomé = GMT = 0, pas d'heure d'été). */
  utcOffsetMinutes: number;
  /** Premier jour réservable (yyyy-MM-dd). */
  openingDate: string;
  /** Nombre de jours réservables à partir du premier jour ouvert. */
  bookingHorizonDays: number;
  /** Jours ouvrés : 0 = dimanche … 6 = samedi. */
  workingDays: number[];
  /** Jours fermés exceptionnels (yyyy-MM-dd). */
  closedDates: string[];
  /** Début du premier créneau (HH:mm, heure du studio). */
  dayStart: string;
  /** Fin maximale du dernier créneau (HH:mm). */
  dayEnd: string;
  slotDurationMinutes: number;
  /** Battement entre deux créneaux. */
  bufferMinutes: number;
  /** Délai minimum avant un créneau le jour même. */
  minNoticeMinutes: number;
  /**
   * Créneaux déjà pris : { "2026-12-01": ["10:00", "14:00"] }.
   * Statique pour l'instant — à remplacer par une requête base de données.
   */
  unavailableSlots: Record<string, string[]>;
}

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  available: boolean;
}

/* ─── Référentiels ──────────────────────────────────────────────────────── */

export type CountryRegion = "afrique-prioritaire" | "afrique" | "monde";

export interface Country {
  /** Code ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  dialCode: string;
  region: CountryRegion;
}

export interface BusinessCategory {
  id: string;
  label: string;
  /** Libellé court (nuage de mots de l'accueil). */
  short: string;
  examples: string;
  icon: LucideIcon;
  /** Photo de fond (floutée) de la tuile « Pour qui ? », dans /public/metiers/. */
  image?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/* ─── Réservation & candidature (types dérivés des schémas zod) ────────── */

export type {
  ReservationInfo,
  Reservation,
} from "@/lib/validation/reservation";
export type { Candidature, CandidatureForm } from "@/lib/validation/candidature";

/** État du tunnel de réservation (persisté en sessionStorage). */
export interface BookingState {
  step: number;
  liveType?: LiveType;
  date?: string;
  slotStart?: string;
  packageId?: PackageId;
  /** Brouillon du formulaire d'informations (peut être incomplet). */
  info?: Partial<import("@/lib/validation/reservation").ReservationInfo>;
  reference?: string;
  /** L'utilisateur modifie une section depuis le récapitulatif. */
  editingFromSummary?: boolean;
}

export interface SendResult {
  ok: boolean;
  whatsappUrl?: string;
  /** La fenêtre WhatsApp n'a pas pu s'ouvrir automatiquement. */
  whatsappBlocked?: boolean;
  emailed?: boolean;
  error?: string;
}
