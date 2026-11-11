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
import { teamDailyEmail } from "./daily";
import { liveReviewEmail, liveToReviewEmail, subscriptionPaidEmail, subscriptionReminderEmail } from "./lives";

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
    case "equipe-recap":
      return teamDailyEmail({
        dateLabel: "jeudi 3 décembre 2026",
        today: [
          { slot: "10h00 – 11h30", businessName: reservation.businessName, fullName: reservation.fullName, phone: reservation.phoneLabel, liveType: "presentiel", packageName: reservation.packageName, status: "Payée", adminUrl: admin },
          { slot: "16h00 – 17h30", businessName: "Kofi Sneakers", fullName: "Kofi Asante", phone: "+225 07 11 22 33 44", liveType: "distance", packageName: "Live à Distance", status: "Payée", adminUrl: admin },
        ],
        tomorrowCount: 3,
        yesterday: { paid: 4, revenue: 95000 },
        remindersSent: 3,
        remindersFailed: 0,
        anomalies: 1,
      });
    case "abonnement-paye":
      return subscriptionPaidEmail({ firstName: "Kofi", paidUntil: "2027-01-02T10:00:00Z", amount: 5000 });
    case "abonnement-rappel":
      return subscriptionReminderEmail({ firstName: "Kofi", paidUntil: "2027-01-02T10:00:00Z" });
    case "live-valide":
      return liveReviewEmail({ firstName: "Kofi", approved: true });
    case "live-refuse":
      return liveReviewEmail({ firstName: "Kofi", approved: false, reason: "Pas en live" });
    case "live-a-valider":
      return liveToReviewEmail({ businessName: "Kofi Sneakers", platform: "TikTok", url: "https://www.tiktok.com/@kofi.sneakers/live", category: "Mode", country: "Côte d'Ivoire", endsLabel: "12h00" });
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
