/**
 * Créneaux où l'équipe valide les lives (heure de Lomé = GMT).
 * L'envoi d'un live n'est possible que pendant ces créneaux ; ils sont affichés partout sur le site.
 * Un live validé reste affiché jusqu'à la fin du créneau + `graceMinutes`.
 */
export const validationWindows = [
  { start: "08:00", end: "11:00" },
  { start: "18:00", end: "21:00" },
] as const;

export const validationGraceMinutes = 60;
