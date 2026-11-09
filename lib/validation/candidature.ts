import { z } from "zod";
import { CANDIDATURE_REF_RE } from "@/lib/reference";
import { phoneCountrySchema, phoneNumberSchema } from "@/lib/validation/reservation";

export const LANGUAGES = ["Français", "Éwé", "Mina", "Kabyè", "Anglais"] as const;
export const AVAILABILITIES = ["Matin", "Après-midi", "Soir", "Week-end"] as const;

export const candidatureFormSchema = z
  .object({
    fullName: z.string().trim().min(2, "Indique ton nom complet.").max(80, "Nom trop long."),
    age: z
      .string()
      .trim()
      .min(1, "Indique ton âge.")
      .regex(/^\d{2}$/, "Indique ton âge en chiffres.")
      .refine((v) => Number(v) >= 18, "Tu dois avoir au moins 18 ans pour postuler."),
    location: z.string().trim().min(2, "Indique ton quartier et ta ville.").max(100, "100 caractères maximum."),
    phoneCountry: phoneCountrySchema,
    phoneNumber: phoneNumberSchema,
    email: z.union([z.literal(""), z.string().trim().email("Adresse email invalide.")]),
    languages: z.array(z.string()).min(1, "Coche au moins une langue."),
    otherLanguages: z.string().trim().max(100, "100 caractères maximum."),
    hasSalesExperience: z.enum(["oui", "non"], {
      errorMap: () => ({ message: "Dis-nous si tu as déjà vendu." }),
    }),
    experienceDetails: z.string().trim().max(600, "600 caractères maximum."),
    videoUrl: z.union([
      z.literal(""),
      z.string().trim().url("Colle un lien valide (TikTok, Google Drive, YouTube…)."),
    ]),
    availability: z.array(z.string()).min(1, "Coche au moins une disponibilité."),
    motivation: z
      .string()
      .trim()
      .min(20, "Dis-nous en quelques phrases pourquoi tu veux nous rejoindre (20 caractères minimum).")
      .max(1000, "1000 caractères maximum."),
    acceptTerms: z.boolean().refine((v) => v === true, "Tu dois accepter pour envoyer ta candidature."),
  })
  .superRefine((data, ctx) => {
    if (data.hasSalesExperience === "oui" && data.experienceDetails.length < 5) {
      ctx.addIssue({ code: "custom", path: ["experienceDetails"], message: "Raconte-nous ton expérience en quelques mots." });
    }
  });

export type CandidatureForm = z.infer<typeof candidatureFormSchema>;

export const candidatureSchema = z.object({
  reference: z.string().regex(CANDIDATURE_REF_RE, "Référence invalide."),
  createdAt: z.string().datetime(),
  data: candidatureFormSchema,
});

export type Candidature = z.infer<typeof candidatureSchema>;
