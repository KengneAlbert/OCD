import { z } from "zod";
import { CATEGORY_IDS, OTHER_CATEGORY_ID, productCountOptions } from "@/config/categories";
import { getCountry } from "@/config/countries";
import { PACKAGE_IDS, getPackage } from "@/config/packages";
import { RESERVATION_REF_RE } from "@/lib/reference";
import { digitsOnly } from "@/lib/utils";
import { isDateKey, isTimeKey } from "@/lib/schedule";

/* ─── Schémas par étape ────────────────────────────────────────────────── */

export const LIVE_TYPES = ["presentiel", "distance"] as const;

export const liveTypeSchema = z.enum(LIVE_TYPES, {
  errorMap: () => ({ message: "Choisis un type de live pour continuer." }),
});

export const stepTypeSchema = z.object({ liveType: liveTypeSchema });

export const stepDateSchema = z.object({
  date: z
    .string({ required_error: "Choisis une date dans le calendrier." })
    .refine(isDateKey, "Choisis une date dans le calendrier."),
});

export const stepSlotSchema = z.object({
  slotStart: z
    .string({ required_error: "Choisis un créneau horaire." })
    .refine(isTimeKey, "Choisis un créneau horaire."),
});

export const stepPackageSchema = z.object({
  packageId: z.enum(PACKAGE_IDS, {
    errorMap: () => ({ message: "Choisis un package pour continuer." }),
  }),
});

/* ─── Champs réutilisables ─────────────────────────────────────────────── */

const optionalText = (max: number, label = "Ce champ") =>
  z.string().trim().max(max, `${label} ne doit pas dépasser ${max} caractères.`);

export const phoneCountrySchema = z
  .string()
  .refine((code) => Boolean(getCountry(code)), "Choisis un indicatif pays.");

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, "Indique ton numéro WhatsApp.")
  .regex(/^[0-9 .\-()]+$/, "Le numéro ne doit contenir que des chiffres (sans l'indicatif).")
  .refine((v) => {
    const n = digitsOnly(v).length;
    return n >= 6 && n <= 15;
  }, "Numéro invalide : vérifie le nombre de chiffres.");

/* ─── Étape 5 : informations ───────────────────────────────────────────── */

export interface InfoSchemaOptions {
  liveType?: (typeof LIVE_TYPES)[number];
  /** Email obligatoire en phase 2 (Brevo). */
  emailRequired?: boolean;
}

export function createInfoSchema({ liveType, emailRequired = false }: InfoSchemaOptions = {}) {
  return z
    .object({
      fullName: z.string().trim().min(2, "Indique ton nom complet.").max(80, "Nom trop long (80 caractères max)."),
      businessName: z
        .string()
        .trim()
        .min(2, "Indique le nom de ton business.")
        .max(80, "Nom trop long (80 caractères max)."),
      category: z
        .string()
        .min(1, "Choisis ta catégorie d'activité.")
        .refine((v) => CATEGORY_IDS.includes(v), "Choisis ta catégorie d'activité."),
      categoryOther: optionalText(60, "La catégorie"),
      productDescription: z
        .string()
        .trim()
        .min(10, "Décris en quelques mots ce que tu vas présenter (10 caractères minimum).")
        .max(600, "Description trop longue (600 caractères max)."),
      phoneCountry: phoneCountrySchema,
      phoneNumber: phoneNumberSchema,
      email: emailRequired
        ? z.string().trim().min(1, "L'email est obligatoire.").email("Adresse email invalide.")
        : z.union([z.literal(""), z.string().trim().email("Adresse email invalide.")]),
      country: z.string(),
      city: optionalText(80, "La ville"),
      shopAddress: optionalText(200, "L'adresse"),
      tiktok: optionalText(200, "Le lien"),
      facebook: optionalText(200, "Le lien"),
      instagram: optionalText(200, "Le lien"),
      productCount: z.union([z.literal(""), z.enum(productCountOptions.map((o) => o.value) as [string, ...string[]])]),
      specialNeeds: optionalText(1000, "Le message"),
      acceptTerms: z.boolean().refine((v) => v === true, "Tu dois accepter les conditions pour continuer."),
    })
    .superRefine((data, ctx) => {
      if (data.category === OTHER_CATEGORY_ID && data.categoryOther.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["categoryOther"], message: "Précise ton activité." });
      }
      if (liveType === "distance") {
        if (!getCountry(data.country)) {
          ctx.addIssue({ code: "custom", path: ["country"], message: "Indique le pays d'où tu fais ton live." });
        }
        if (data.city.trim().length < 2) {
          ctx.addIssue({ code: "custom", path: ["city"], message: "Indique ta ville." });
        }
      }
    });
}

export type ReservationInfo = z.infer<ReturnType<typeof createInfoSchema>>;

export const emptyInfo: ReservationInfo = {
  fullName: "",
  businessName: "",
  category: "",
  categoryOther: "",
  productDescription: "",
  phoneCountry: "TG",
  phoneNumber: "",
  email: "",
  country: "",
  city: "",
  shopAddress: "",
  tiktok: "",
  facebook: "",
  instagram: "",
  productCount: "",
  specialNeeds: "",
  acceptTerms: false,
};

/* ─── Réservation complète (validée côté client ET serveur) ────────────── */

export function createReservationSchema(options: Pick<InfoSchemaOptions, "emailRequired"> = {}) {
  return z
    .object({
      reference: z.string().regex(RESERVATION_REF_RE, "Référence invalide."),
      liveType: liveTypeSchema,
      date: stepDateSchema.shape.date,
      slotStart: stepSlotSchema.shape.slotStart,
      slotEnd: z.string().refine(isTimeKey, "Créneau invalide."),
      packageId: stepPackageSchema.shape.packageId,
      info: z.unknown(),
      createdAt: z.string().datetime(),
    })
    .transform((data, ctx) => {
      const info = createInfoSchema({ liveType: data.liveType, emailRequired: options.emailRequired }).safeParse(data.info);
      if (!info.success) {
        info.error.issues.forEach((issue) => ctx.addIssue({ ...issue, path: ["info", ...issue.path] }));
        return z.NEVER;
      }
      const pkg = getPackage(data.packageId);
      if (pkg && !pkg.compatibleWith.includes(data.liveType)) {
        ctx.addIssue({ code: "custom", path: ["packageId"], message: "Ce package n'est pas disponible pour ce type de live." });
        return z.NEVER;
      }
      return { ...data, info: info.data };
    });
}

export type Reservation = z.output<ReturnType<typeof createReservationSchema>>;
