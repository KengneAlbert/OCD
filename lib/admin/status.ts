/** Statuts et libellés partagés entre l'admin, l'API et les emails. */

export const RESERVATION_STATUSES = ["nouvelle", "confirmee", "payee", "realisee", "annulee", "absente"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const CANDIDATURE_STATUSES = ["nouvelle", "en_revue", "entretien", "retenue", "refusee"] as const;
export type CandidatureStatus = (typeof CANDIDATURE_STATUSES)[number];

type Tone = "orange" | "blue" | "green" | "violet" | "gray" | "red";

export const reservationStatusMeta: Record<ReservationStatus, { label: string; tone: Tone; hint: string }> = {
  nouvelle: { label: "Nouvelle", tone: "orange", hint: "À traiter : vérifier le créneau et confirmer au client." },
  confirmee: { label: "Confirmée", tone: "blue", hint: "Créneau confirmé, en attente du paiement." },
  payee: { label: "Payée", tone: "violet", hint: "Paiement reçu, le live est calé." },
  realisee: { label: "Réalisée", tone: "green", hint: "Le live a eu lieu." },
  annulee: { label: "Annulée", tone: "gray", hint: "Le créneau est libéré." },
  absente: { label: "Absent·e", tone: "red", hint: "Le client ne s'est pas présenté." },
};

export const candidatureStatusMeta: Record<CandidatureStatus, { label: string; tone: Tone; hint: string }> = {
  nouvelle: { label: "Nouvelle", tone: "orange", hint: "Candidature à lire." },
  en_revue: { label: "En revue", tone: "blue", hint: "En cours d'étude par l'équipe." },
  entretien: { label: "Essai prévu", tone: "violet", hint: "Essai au studio à organiser." },
  retenue: { label: "Retenue", tone: "green", hint: "Candidate retenue." },
  refusee: { label: "Non retenue", tone: "gray", hint: "Candidature non retenue." },
};

export const toneClasses: Record<Tone, string> = {
  orange: "bg-ocd-orange/15 text-ocd-orange-dark ring-ocd-orange/30 dark:text-ocd-orange",
  blue: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  green: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  violet: "bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  gray: "bg-foreground/8 text-muted-foreground ring-foreground/15",
  red: "bg-red-500/12 text-red-700 ring-red-500/25 dark:text-red-300",
};

export const isReservationStatus = (v: unknown): v is ReservationStatus =>
  typeof v === "string" && (RESERVATION_STATUSES as readonly string[]).includes(v);

export const isCandidatureStatus = (v: unknown): v is CandidatureStatus =>
  typeof v === "string" && (CANDIDATURE_STATUSES as readonly string[]).includes(v);
