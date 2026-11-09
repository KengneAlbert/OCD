/** Données fictives pour prévisualiser les gabarits dans l'admin. */
import {
  candidatureReceivedEmail,
  candidatureTeamEmail,
  candidatureUpdateEmail,
  reservationCancelledEmail,
  reservationConfirmedEmail,
  reservationPaidEmail,
  reservationReceivedEmail,
  reservationReminderEmail,
  reservationTeamEmail,
  reservationThanksEmail,
  toCandidatureView,
  toReservationView,
  type EmailContent,
  type EmailTemplateId,
} from "./templates";

const reservation = toReservationView({
  reference: "OCD-K7M2QX",
  liveType: "presentiel",
  date: "2026-12-03",
  slotStart: "10:00",
  slotEnd: "11:30",
  packageId: "pack-4",
  fullName: "Ama Koffi",
  businessName: "Ama Délices",
  email: "ama@exemple.com",
  phoneCountry: "TG",
  phoneNumber: "90 12 34 56",
  category: "restauration",
  productDescription: "Jus de bissap, gingembre et baobab en bouteilles de 50 cl, pâtisseries maison.",
  productCount: "6-10",
  shopAddress: "Marché de Bè, allée 4, Lomé",
  tiktok: "@amadelices",
  specialNeeds: "Une table pour exposer les bouteilles.",
  payUrl: "https://ocdlive.com/paiement/exemple",
});

const candidature = toCandidatureView({
  reference: "CAND-P3R8TZ",
  fullName: "Esi Mensah",
  email: "esi@exemple.com",
  age: 24,
  location: "Adidogomé, Lomé",
  phoneCountry: "TG",
  phoneNumber: "91 22 33 44",
  languages: ["Français", "Éwé", "Mina"],
  availability: ["Après-midi", "Soir"],
  hasSalesExperience: true,
  experienceDetails: "2 ans vendeuse de pagnes au Grand Marché.",
  videoUrl: "https://www.tiktok.com/@exemple/video/123",
  motivation: "J'adore parler aux clients et je veux montrer les produits de chez nous au monde entier.",
});

const admin = "https://ocdlive.com/admin/reservations/exemple";

export function renderSample(id: EmailTemplateId): EmailContent {
  switch (id) {
    case "reservation-recue":
      return reservationReceivedEmail(reservation);
    case "reservation-equipe":
      return reservationTeamEmail(reservation, admin);
    case "reservation-confirmee":
      return reservationConfirmedEmail(reservation, "Pense à venir avec tes bouteilles déjà étiquetées.");
    case "reservation-payee":
      return reservationPaidEmail(reservation);
    case "reservation-rappel":
      return reservationReminderEmail(reservation);
    case "reservation-merci":
      return reservationThanksEmail(reservation);
    case "reservation-annulee":
      return reservationCancelledEmail(reservation, "Le créneau a dû être libéré suite à un imprévu au studio.");
    case "candidature-recue":
      return candidatureReceivedEmail(candidature);
    case "candidature-equipe":
      return candidatureTeamEmail(candidature, admin);
    case "candidature-essai":
      return candidatureUpdateEmail(candidature, "entretien", "On te propose samedi à 10h au studio.");
    case "candidature-retenue":
      return candidatureUpdateEmail(candidature, "retenue");
    case "candidature-refusee":
      return candidatureUpdateEmail(candidature, "refusee");
  }
}
