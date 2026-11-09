/**
 * Gabarits des emails transactionnels OCD Live.
 * Chaque gabarit renvoie { subject, preheader, html, text } (le texte brut
 * est obligatoire pour la délivrabilité). Les données passent par des
 * « vues » simples, construites depuis le formulaire ou depuis Supabase.
 */
import { getCategoryLabel, getProductCountLabel } from "@/config/categories";
import { prepareChecklist } from "@/config/content";
import { getCountry } from "@/config/countries";
import { getPackage } from "@/config/packages";
import { siteConfig } from "@/config/site";
import { formatDateFr, formatSlotFr } from "@/lib/schedule";
import { formatPrice } from "@/lib/utils";
import { formatPhone } from "@/lib/whatsapp";
import type { Candidature, Reservation } from "@/types";
import { button, C, callout, detailsCard, esc, heading, layout, paragraph, pill, small, steps } from "./layout";
import { PAYMENT_SUMMARY } from "@/config/payment-methods";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/* ─── Vues ─────────────────────────────────────────────────────────────── */

export interface ReservationView {
  reference: string;
  fullName: string;
  firstName: string;
  businessName: string;
  email?: string;
  liveType: "presentiel" | "distance";
  liveTypeLabel: string;
  dateLabel: string;
  slotLabel: string;
  packageName: string;
  priceLabel: string;
  phoneLabel: string;
  categoryLabel: string;
  productDescription: string;
  productCountLabel?: string;
  location?: string;
  shopAddress?: string;
  socials?: string;
  specialNeeds?: string;
  /** Lien de paiement Mobile Money (si le paiement en ligne est activé). */
  payUrl?: string;
}

export interface CandidatureView {
  reference: string;
  fullName: string;
  firstName: string;
  email?: string;
  age: string;
  location: string;
  phoneLabel: string;
  languages: string;
  availability: string;
  experience: string;
  videoUrl?: string;
  motivation: string;
}

const firstNameOf = (full: string) => full.trim().split(/\s+/)[0] ?? full;

const liveTypeLabel = (type: "presentiel" | "distance") => (type === "presentiel" ? "Au studio, à Lomé" : "À distance");

/** Données minimales communes au formulaire et à la base. */
export interface ReservationLike {
  reference: string;
  liveType: "presentiel" | "distance";
  date: string;
  slotStart: string;
  slotEnd: string;
  packageId: string;
  packageName?: string;
  packagePrice?: number;
  fullName: string;
  businessName: string;
  email?: string | null;
  phoneCountry: string;
  phoneNumber: string;
  category: string;
  categoryOther?: string | null;
  productDescription: string;
  productCount?: string | null;
  country?: string | null;
  city?: string | null;
  shopAddress?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  specialNeeds?: string | null;
  payUrl?: string;
}

export function reservationLikeFromForm(r: Reservation): ReservationLike {
  const { info } = r;
  return {
    reference: r.reference,
    liveType: r.liveType,
    date: r.date,
    slotStart: r.slotStart,
    slotEnd: r.slotEnd,
    packageId: r.packageId,
    fullName: info.fullName,
    businessName: info.businessName,
    email: info.email,
    phoneCountry: info.phoneCountry,
    phoneNumber: info.phoneNumber,
    category: info.category,
    categoryOther: info.categoryOther,
    productDescription: info.productDescription,
    productCount: info.productCount,
    country: info.country,
    city: info.city,
    shopAddress: info.shopAddress,
    tiktok: info.tiktok,
    facebook: info.facebook,
    instagram: info.instagram,
    specialNeeds: info.specialNeeds,
  };
}

export function toReservationView(r: ReservationLike): ReservationView {
  const pkg = getPackage(r.packageId);
  const price = r.packagePrice ?? pkg?.price;
  const country = r.country ? (getCountry(r.country)?.name ?? r.country) : undefined;
  const socials = [
    r.tiktok && `TikTok ${r.tiktok}`,
    r.facebook && `Facebook ${r.facebook}`,
    r.instagram && `Instagram ${r.instagram}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    reference: r.reference,
    fullName: r.fullName,
    firstName: firstNameOf(r.fullName),
    businessName: r.businessName,
    email: r.email || undefined,
    liveType: r.liveType,
    liveTypeLabel: liveTypeLabel(r.liveType),
    dateLabel: formatDateFr(r.date),
    slotLabel: `${formatSlotFr(r.slotStart, r.slotEnd)} (heure de Lomé)`,
    packageName: r.packageName ?? pkg?.name ?? r.packageId,
    priceLabel: price !== undefined ? formatPrice(price) : "—",
    phoneLabel: formatPhone(r.phoneCountry, r.phoneNumber),
    categoryLabel: getCategoryLabel(r.category, r.categoryOther ?? undefined),
    productDescription: r.productDescription,
    productCountLabel: getProductCountLabel(r.productCount ?? undefined),
    location: r.liveType === "distance" ? [r.city, country].filter(Boolean).join(", ") || undefined : undefined,
    shopAddress: r.shopAddress || undefined,
    socials: socials || undefined,
    specialNeeds: r.specialNeeds || undefined,
    payUrl: r.payUrl,
  };
}

export interface CandidatureLike {
  reference: string;
  fullName: string;
  email?: string | null;
  age: string | number | null;
  location: string | null;
  phoneCountry: string;
  phoneNumber: string;
  languages: string[];
  availability: string[];
  hasSalesExperience: boolean | null;
  experienceDetails?: string | null;
  videoUrl?: string | null;
  motivation: string | null;
}

export function candidatureLikeFromForm(c: Candidature): CandidatureLike {
  const d = c.data;
  return {
    reference: c.reference,
    fullName: d.fullName,
    email: d.email,
    age: d.age,
    location: d.location,
    phoneCountry: d.phoneCountry,
    phoneNumber: d.phoneNumber,
    languages: [...d.languages, ...(d.otherLanguages ? [d.otherLanguages] : [])],
    availability: d.availability,
    hasSalesExperience: d.hasSalesExperience === "oui",
    experienceDetails: d.experienceDetails,
    videoUrl: d.videoUrl,
    motivation: d.motivation,
  };
}

export function toCandidatureView(c: CandidatureLike): CandidatureView {
  return {
    reference: c.reference,
    fullName: c.fullName,
    firstName: firstNameOf(c.fullName),
    email: c.email || undefined,
    age: c.age ? `${c.age} ans` : "—",
    location: c.location ?? "—",
    phoneLabel: formatPhone(c.phoneCountry, c.phoneNumber),
    languages: c.languages.join(", ") || "—",
    availability: c.availability.join(", ") || "—",
    experience: c.hasSalesExperience ? `Oui — ${c.experienceDetails || "non précisé"}` : "Non",
    videoUrl: c.videoUrl || undefined,
    motivation: c.motivation ?? "",
  };
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

const waLink = (text?: string) =>
  `https://wa.me/${siteConfig.whatsappNumber.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

const studioAddress = `${siteConfig.studio.street}, ${siteConfig.studio.district}, ${siteConfig.studio.city}`;

function bookingRows(v: ReservationView): [string, string | undefined][] {
  return [
    ["Référence", v.reference],
    ["Type de live", v.liveType === "distance" && v.location ? `${v.liveTypeLabel} · ${v.location}` : v.liveTypeLabel],
    ["Date", v.dateLabel],
    ["Créneau", v.slotLabel],
    ["Package", `${v.packageName} · ${v.priceLabel}`],
    ["Business", v.businessName],
  ];
}

function textBlock(lines: (string | false | undefined)[]): string {
  return lines.filter((l) => l !== false && l !== undefined).join("\n");
}

function textRows(rows: [string, string | undefined][]): string {
  return rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k} : ${v}`)
    .join("\n");
}

const signature = "À très vite en live !\nL'équipe OCD Live";

/* ─── Réservations ─────────────────────────────────────────────────────── */

/** Client : la demande est bien reçue (envoyé à la réservation). */
export function reservationReceivedEmail(v: ReservationView): EmailContent {
  const rows = bookingRows(v);
  const html = layout({
    preheader: `Référence ${v.reference} · ${v.dateLabel}, ${v.slotLabel}. On te confirme très vite sur WhatsApp.`,
    body: [
      pill("Demande reçue"),
      heading(`Merci ${v.firstName}, on a bien reçu ta`, "demande."),
      paragraph(
        `L'équipe OCD Live vérifie la disponibilité de ton créneau et te le confirme <strong>sur WhatsApp au ${esc(v.phoneLabel)}</strong>, en général dans la journée.`,
      ),
      detailsCard(rows, "Ta réservation"),
      v.payUrl
        ? callout(`<strong>Bloque ton créneau dès maintenant :</strong> règle ${esc(v.priceLabel)} par ${esc(PAYMENT_SUMMARY)}. Ton créneau est réservé pour toi dès réception du paiement.`, "dark") +
          button(`Payer ${v.priceLabel}`, v.payUrl)
        : "",
      steps(
        [
          { title: "On vérifie ton créneau", text: "Tu reçois la confirmation sur WhatsApp et par email." },
          { title: "Tu règles ton package", text: "Le créneau est définitivement bloqué après paiement." },
          { title: "Tu prépares ton live", text: "On t'envoie nos conseils pour vendre un maximum en direct." },
        ],
        "La suite",
      ),
      button("Écrire à l'équipe sur WhatsApp", waLink(`Bonjour OCD Live, c'est à propos de ma réservation ${v.reference}.`), "whatsapp"),
      small(`Garde bien ta référence <strong>${esc(v.reference)}</strong> : elle nous permet de retrouver ta demande en un clin d'œil.`),
    ].join(""),
  });
  const text = textBlock([
    `Merci ${v.firstName}, on a bien reçu ta demande !`,
    "",
    `L'équipe OCD Live vérifie la disponibilité de ton créneau et te le confirme sur WhatsApp (${v.phoneLabel}).`,
    "",
    textRows(rows),
    "",
    "La suite : 1) confirmation du créneau, 2) paiement du package, 3) préparation de ton live.",
    v.payUrl && `Payer maintenant : ${v.payUrl}`,
    `WhatsApp : ${waLink()}`,
    "",
    signature,
  ]);
  return { subject: `Demande reçue · ton live du ${v.dateLabel} (${v.reference})`, html, text };
}

/** Équipe : nouvelle réservation, toutes les infos + lien admin. */
export function reservationTeamEmail(v: ReservationView, adminUrl?: string): EmailContent {
  const rows: [string, string | undefined][] = [
    ...bookingRows(v),
    ["Nom", v.fullName],
    ["WhatsApp", v.phoneLabel],
    ["Email", v.email],
    ["Catégorie", v.categoryLabel],
    ["Produits", v.productDescription],
    ["Nb de produits", v.productCountLabel],
    ["Boutique", v.shopAddress],
    ["Réseaux", v.socials],
    ["Besoins", v.specialNeeds],
  ];
  const phoneDigits = v.phoneLabel.replace(/\D/g, "");
  const html = layout({
    internal: true,
    preheader: `${v.businessName} · ${v.dateLabel}, ${v.slotLabel} · ${v.packageName}`,
    body: [
      pill("Nouvelle réservation payée", C.ink, C.orange),
      heading(v.businessName, "veut passer en live."),
      paragraph(`${esc(v.fullName)} a réservé le <strong>${esc(v.dateLabel)}</strong> de <strong>${esc(v.slotLabel)}</strong>.`),
      detailsCard(rows, "Détails"),
      adminUrl ? button("Ouvrir dans l'admin", adminUrl, "dark") : "",
      button(`Répondre sur WhatsApp`, `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Bonjour ${v.firstName}, ici l'équipe OCD Live à propos de ta réservation ${v.reference}.`)}`, "whatsapp"),
    ].join(""),
  });
  return {
    subject: `💳 Réservation payée ${v.reference} · ${v.businessName} · ${v.dateLabel}`,

    html,
    text: textBlock(["Nouvelle réservation payée", "", textRows(rows), adminUrl && `\nAdmin : ${adminUrl}`]),
  };
}

/** Client : créneau confirmé par l'équipe. */
export function reservationConfirmedEmail(v: ReservationView, note?: string): EmailContent {
  const where =
    v.liveType === "presentiel"
      ? `Rendez-vous au <strong>${esc(siteConfig.studio.name)}</strong>, ${esc(studioAddress)}. Arrive <strong>30 minutes avant</strong> pour l'installation.`
      : "Une animatrice t'accompagne depuis le studio. On fait un <strong>test de connexion</strong> avec toi avant le jour J.";
  const html = layout({
    preheader: `C'est calé : ${v.dateLabel}, ${v.slotLabel}. Voici tout ce qu'il faut savoir.`,
    body: [
      pill("Créneau confirmé", "#E7F8EE", "#1B7A43"),
      heading(`C'est calé, ${v.firstName} ! Ton live est`, "confirmé."),
      paragraph(where),
      detailsCard(bookingRows(v), "Ton live"),
      note ? callout(`<strong>Message de l'équipe :</strong> ${esc(note)}`) : "",
      callout(
        v.payUrl
          ? `<strong>Paiement :</strong> ${esc(v.priceLabel)} à régler pour bloquer définitivement ton créneau. Paie en 1 minute par ${esc(PAYMENT_SUMMARY)}.`
          : `<strong>Paiement :</strong> ${esc(v.priceLabel)} à régler pour bloquer définitivement ton créneau. L'équipe t'indique le moyen de paiement.`,
        "dark",
      ),
      v.payUrl ? button(`Payer ${v.priceLabel}`, v.payUrl) : "",
      steps(prepareChecklist.slice(0, 4), "Prépare ton live"),
      button("Voir tous nos conseils", `${siteConfig.url}/comment-ca-marche`),
      small(`Besoin de reporter ? Préviens-nous au moins 48 h avant sur WhatsApp. Référence : ${esc(v.reference)}.`),
    ].join(""),
  });
  const text = textBlock([
    `C'est calé, ${v.firstName} ! Ton live est confirmé.`,
    "",
    v.liveType === "presentiel"
      ? `Rendez-vous au ${siteConfig.studio.name}, ${studioAddress}. Arrive 30 minutes avant.`
      : "Une animatrice t'accompagne depuis le studio. Test de connexion avant le jour J.",
    "",
    textRows(bookingRows(v)),
    note && `\nMessage de l'équipe : ${note}`,
    "",
    `Paiement : ${v.priceLabel} pour bloquer définitivement ton créneau.`,
    v.payUrl && `Payer en ligne : ${v.payUrl}`,
    "",
    "Prépare ton live :",
    ...prepareChecklist.slice(0, 4).map((c) => `- ${c.title} : ${c.text}`),
    "",
    signature,
  ]);
  return { subject: `✅ Ton live du ${v.dateLabel} est confirmé (${v.reference})`, html, text };
}

/** Client : paiement reçu, tout est prêt. */
export function reservationPaidEmail(v: ReservationView): EmailContent {
  const html = layout({
    preheader: `Paiement reçu pour ${v.reference}. Ton créneau est définitivement bloqué.`,
    body: [
      pill("Paiement reçu", "#EFE9FF", "#5B3BB5"),
      heading(`Merci ${v.firstName}, ton créneau est`, "bloqué."),
      paragraph("On a bien reçu ton paiement. Il ne te reste plus qu'à préparer tes produits : on s'occupe du reste."),
      detailsCard(bookingRows(v), "Ton live"),
      v.payUrl ? button("📅 Ajouter à mon agenda", v.payUrl.replace("/paiement/", "/api/agenda/"), "dark") : "",
      steps(prepareChecklist, "Ta checklist"),
      small(`Référence : ${esc(v.reference)}.`),
    ].join(""),
  });
  return {
    subject: `💳 Paiement reçu · ton live du ${v.dateLabel} est bloqué`,

    html,
    text: textBlock([`Merci ${v.firstName}, paiement reçu : ton créneau est bloqué.`, "", textRows(bookingRows(v)), v.payUrl && `\nAjouter à mon agenda : ${v.payUrl.replace("/paiement/", "/api/agenda/")}`, "", signature]),
  };
}

/** Client : rappel la veille. */
export function reservationReminderEmail(v: ReservationView): EmailContent {
  const html = layout({
    preheader: `Demain, ${v.slotLabel} : c'est ton moment.`,
    body: [
      pill("Rappel · J-1"),
      heading(`${v.firstName}, demain tu passes`, "en live."),
      paragraph(
        v.liveType === "presentiel"
          ? `On t'attend au studio <strong>30 minutes avant</strong> ton créneau, ${esc(studioAddress)}.`
          : "Vérifie ta connexion, charge ton téléphone et installe-toi face à la lumière.",
      ),
      detailsCard(bookingRows(v), "Ton live"),
      steps(prepareChecklist, "Dernières vérifications"),
      button("Une question ? WhatsApp", waLink(`Bonjour, c'est pour mon live de demain (${v.reference}).`), "whatsapp"),
    ].join(""),
  });
  return {
    subject: `⏰ Demain, c'est ton live ! (${v.slotLabel})`,

    html,
    text: textBlock([`${v.firstName}, demain tu passes en live.`, "", textRows(bookingRows(v)), "", ...prepareChecklist.map((c) => `- ${c.title}`), "", signature]),
  };
}

/** Client : merci après le live. */
export function reservationThanksEmail(v: ReservationView): EmailContent {
  const html = layout({
    preheader: "Merci pour ton live ! On remet ça quand tu veux.",
    body: [
      pill("Merci !"),
      heading(`Bravo ${v.firstName}, c'était ton`, "moment."),
      paragraph(
        "Merci d'avoir fait ton live avec OCD Live. Pense à relancer les personnes qui t'ont écrit pendant le direct : c'est souvent là que les ventes se concluent.",
      ),
      callout("Les vendeurs qui passent en live <strong>chaque semaine</strong> vendent bien plus. Le pack de 4 lives est fait pour ça."),
      button("Réserver mon prochain live", `${siteConfig.url}/reserver`),
      small("Un avis sur ton expérience ? Réponds simplement à cet email, on lit tout."),
    ].join(""),
  });
  return {
    subject: `🙏 Merci pour ton live, ${v.firstName} !`,

    html,
    text: textBlock([`Bravo ${v.firstName} et merci pour ton live avec OCD Live !`, "", `Réserver ton prochain live : ${siteConfig.url}/reserver`, "", signature]),
  };
}

/** Client : réservation annulée. */
export function reservationCancelledEmail(v: ReservationView, reason?: string): EmailContent {
  const html = layout({
    preheader: `Ta réservation ${v.reference} a été annulée.`,
    body: [
      pill("Réservation annulée", "#F1EFEC", C.muted),
      heading(`${v.firstName}, ta réservation est`, "annulée.", ),
      paragraph(`Ta réservation du <strong>${esc(v.dateLabel)}</strong> (${esc(v.slotLabel)}) a été annulée.`),
      reason ? callout(`<strong>Motif :</strong> ${esc(reason)}`) : "",
      paragraph("Tu veux choisir un autre créneau ? Ça prend 3 minutes."),
      button("Choisir un nouveau créneau", `${siteConfig.url}/reserver`),
      small(`Référence : ${esc(v.reference)}. Une question ? Réponds à cet email ou écris-nous sur WhatsApp.`),
    ].join(""),
  });
  return {
    subject: `Ta réservation ${v.reference} est annulée`,

    html,
    text: textBlock([
      `${v.firstName}, ta réservation du ${v.dateLabel} (${v.slotLabel}) a été annulée.`,
      reason && `Motif : ${reason}`,
      "",
      `Choisir un nouveau créneau : ${siteConfig.url}/reserver`,
      "",
      "L'équipe OCD Live",
    ]),
  };
}

/* ─── Candidatures ─────────────────────────────────────────────────────── */

export function candidatureReceivedEmail(v: CandidatureView): EmailContent {
  const html = layout({
    preheader: `Référence ${v.reference}. On étudie ta candidature et on te recontacte sur WhatsApp.`,
    body: [
      pill("Candidature reçue"),
      heading(`Merci ${v.firstName}, ta candidature est`, "entre nos mains."),
      paragraph(
        `L'équipe OCD Live étudie chaque candidature avec attention. Si ton profil correspond, on te contacte <strong>sur WhatsApp au ${esc(v.phoneLabel)}</strong> pour un essai au studio.`,
      ),
      detailsCard(
        [
          ["Référence", v.reference],
          ["Langues", v.languages],
          ["Disponibilités", v.availability],
        ],
        "Ta candidature",
      ),
      callout("Astuce : si tu n'as pas encore envoyé de vidéo, prépare 30 secondes où tu te présentes et vends un objet de ton choix. C'est ce qui fait la différence."),
      small("Tu n'as rien d'autre à faire pour l'instant. Bonne chance !"),
    ].join(""),
  });
  return {
    subject: `Candidature reçue · OCD Live (${v.reference})`,

    html,
    text: textBlock([
      `Merci ${v.firstName}, ta candidature est bien reçue.`,
      `Si ton profil correspond, on te contacte sur WhatsApp (${v.phoneLabel}) pour un essai au studio.`,
      "",
      `Référence : ${v.reference}`,
      "",
      "L'équipe OCD Live",
    ]),
  };
}

export function candidatureTeamEmail(v: CandidatureView, adminUrl?: string): EmailContent {
  const rows: [string, string | undefined][] = [
    ["Référence", v.reference],
    ["Nom", v.fullName],
    ["Âge", v.age],
    ["Quartier / ville", v.location],
    ["WhatsApp", v.phoneLabel],
    ["Email", v.email],
    ["Langues", v.languages],
    ["Expérience", v.experience],
    ["Disponibilités", v.availability],
    ["Vidéo", v.videoUrl],
    ["Motivation", v.motivation],
  ];
  const html = layout({
    internal: true,
    preheader: `${v.fullName} · ${v.age} · ${v.location}`,
    body: [
      pill("Casting animatrice", C.ink, C.orange),
      heading(v.fullName, "veut rejoindre l'équipe."),
      detailsCard(rows, "Profil"),
      v.videoUrl ? button("Voir la vidéo", v.videoUrl, "dark") : "",
      adminUrl ? button("Ouvrir dans l'admin", adminUrl) : "",
    ].join(""),
  });
  return {
    subject: `👩🏾‍💼 Candidature ${v.reference} · ${v.fullName}`,

    html,
    text: textBlock(["Nouvelle candidature animatrice", "", textRows(rows), adminUrl && `\nAdmin : ${adminUrl}`]),
  };
}

export function candidatureUpdateEmail(v: CandidatureView, status: "entretien" | "retenue" | "refusee", note?: string): EmailContent {
  const copy = {
    entretien: {
      pill: "Essai au studio",
      title: [`${v.firstName}, on aimerait te`, "rencontrer."] as const,
      body: "Ton profil nous a plu ! On te propose un essai au studio pour te voir en situation. L'équipe te contacte sur WhatsApp pour fixer le jour et l'heure.",
      subject: `🎬 OCD Live · on t'invite pour un essai au studio`,
    },
    retenue: {
      pill: "Bienvenue",
      title: [`Bienvenue dans l'équipe,`, `${v.firstName} !`] as const,
      body: "Tu es retenue pour animer les lives OCD Live. L'équipe te contacte sur WhatsApp pour la suite : formation, planning et premiers lives.",
      subject: `🎉 Bienvenue chez OCD Live, ${v.firstName} !`,
    },
    refusee: {
      pill: "Ta candidature",
      title: [`Merci ${v.firstName} pour ta`, "candidature."] as const,
      body: "Après étude, nous ne pouvons pas donner suite pour le moment. On garde ton profil : de nouveaux castings auront lieu, n'hésite pas à retenter ta chance.",
      subject: `Ta candidature OCD Live (${v.reference})`,
    },
  }[status];

  const html = layout({
    preheader: copy.body.slice(0, 90),
    body: [
      pill(copy.pill),
      heading(copy.title[0], copy.title[1]),
      paragraph(copy.body),
      note ? callout(`<strong>Message de l'équipe :</strong> ${esc(note)}`) : "",
      small(`Référence : ${esc(v.reference)}.`),
    ].join(""),
  });
  return {
    subject: copy.subject,

    html,
    text: textBlock([`${copy.title[0]} ${copy.title[1]}`, "", copy.body, note && `\nMessage de l'équipe : ${note}`, "", "L'équipe OCD Live"]),
  };
}

/* ─── Catalogue (aperçu dans l'admin) ──────────────────────────────────── */

export const EMAIL_TEMPLATES = {
  "reservation-recue": { label: "Réservation · demande reçue", audience: "Client", trigger: "Plus envoyé automatiquement (réservation = paiement)" },
  "reservation-equipe": { label: "Réservation · alerte équipe", audience: "Équipe", trigger: "Automatique après chaque paiement" },
  "reservation-confirmee": { label: "Réservation · confirmée", audience: "Client", trigger: "Statut « Confirmée » dans l'admin" },
  "reservation-payee": { label: "Réservation · paiement reçu", audience: "Client", trigger: "Automatique après chaque paiement" },
  "reservation-rappel": { label: "Réservation · rappel J-1", audience: "Client", trigger: "Bouton « Envoyer le rappel » dans l'admin" },
  "reservation-merci": { label: "Réservation · merci", audience: "Client", trigger: "Statut « Réalisée » dans l'admin" },
  "reservation-annulee": { label: "Réservation · annulée", audience: "Client", trigger: "Statut « Annulée » dans l'admin" },
  "candidature-recue": { label: "Candidature · accusé de réception", audience: "Candidate", trigger: "Automatique (si email fourni)" },
  "candidature-equipe": { label: "Candidature · alerte équipe", audience: "Équipe", trigger: "Automatique à chaque candidature" },
  "candidature-essai": { label: "Candidature · invitation à l'essai", audience: "Candidate", trigger: "Statut « Essai prévu » dans l'admin" },
  "candidature-retenue": { label: "Candidature · retenue", audience: "Candidate", trigger: "Statut « Retenue » dans l'admin" },
  "candidature-refusee": { label: "Candidature · non retenue", audience: "Candidate", trigger: "Statut « Non retenue » dans l'admin" },
} as const;

export type EmailTemplateId = keyof typeof EMAIL_TEMPLATES;
