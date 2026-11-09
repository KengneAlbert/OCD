import type { NotificationProvider } from "@/types";

export function resolveProvider(value: string | undefined): NotificationProvider {
  return value === "brevo" || value === "both" ? value : "whatsapp";
}

export const usesWhatsApp = (provider: NotificationProvider) => provider !== "brevo";
export const usesEmail = (provider: NotificationProvider) => provider !== "whatsapp";

/**
 * Les réservations partent TOUJOURS par email (Brevo) et sont enregistrées dans Supabase,
 * quel que soit NOTIFICATION_PROVIDER (qui ne règle plus que les candidatures).
 */
export const RESERVATION_PROVIDER: NotificationProvider = "brevo";

/** Provider vu par le navigateur (injecté au build depuis NOTIFICATION_PROVIDER). */
export const clientProvider: NotificationProvider = resolveProvider(process.env.NEXT_PUBLIC_NOTIFICATION_PROVIDER);
