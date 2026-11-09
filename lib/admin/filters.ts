import type { CandidatureFilters, ReservationFilters } from "@/lib/db/admin-queries";
import { isCandidatureStatus, isReservationStatus } from "./status";

type Search = Record<string, string | undefined>;

const date = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

/** Paramètres d'URL → filtres de la liste des réservations (valeurs inconnues ignorées). */
export function parseReservationFilters(sp: Search): ReservationFilters {
  return {
    q: sp.q?.slice(0, 60),
    status: isReservationStatus(sp.status) ? sp.status : undefined,
    type: sp.type === "presentiel" || sp.type === "distance" ? sp.type : undefined,
    from: date(sp.from),
    to: date(sp.to),
    sort: sp.sort === "live" ? "live" : "created",
    page: Number(sp.page) || 1,
  };
}

export function parseCandidatureFilters(sp: Search): CandidatureFilters {
  return {
    q: sp.q?.slice(0, 60),
    status: isCandidatureStatus(sp.status) ? sp.status : undefined,
    page: Number(sp.page) || 1,
  };
}
