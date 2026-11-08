/** Accès sessionStorage tolérant (navigation privée, stockage bloqué…). */
export const STORAGE_KEYS = {
  booking: "ocd-booking-v1",
  lastReservation: "ocd-last-reservation-v1",
} as const;

export function readSession<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on continue sans persistance */
  }
}

export function removeSession(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
