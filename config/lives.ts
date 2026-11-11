/**
 * Annuaire des lives + abonnement des vendeurs. Tout se règle ici.
 * Les créneaux de validation sont dans config/validation-windows.ts.
 */
import { validationGraceMinutes, validationWindows } from "./validation-windows";

export const livesConfig = {
  /** Abonnement mensuel pour publier ses lives. */
  subscriptionPrice: 5000,
  subscriptionDays: 30,
  /** Rappel de renouvellement envoyé quand il reste ce nombre de jours. */
  renewalReminderDays: 3,

  validationWindows,
  /** Un live validé disparaît à la fin du créneau + ce délai (minutes). */
  graceMinutes: validationGraceMinutes,

  /** Rafraîchissement automatique des pages de l'annuaire (secondes). */
  refreshSeconds: 60,
  /** Vérification de la file d'attente dans l'admin (secondes). */
  adminRefreshSeconds: 15,

  /** Motifs de refus proposés à l'équipe (un tap). */
  rejectReasons: ["Pas en live", "Pas de vente", "Lien invalide", "Contenu interdit"],
} as const;
