"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PhoneField } from "@/components/forms/phone-field";
import { WhatsAppIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FieldError, Input, Textarea } from "@/components/ui/form-controls";
import { DEFAULT_COUNTRY_CODE } from "@/config/countries";
import { clientProvider, sendCandidature, usesWhatsApp } from "@/lib/notifications";
import { generateReference } from "@/lib/reference";
import { AVAILABILITIES, LANGUAGES, candidatureFormSchema, type CandidatureForm as FormValues } from "@/lib/validation/candidature";
import type { SendResult } from "@/types";

const defaultValues: FormValues = {
  fullName: "",
  age: "",
  location: "",
  phoneCountry: DEFAULT_COUNTRY_CODE,
  phoneNumber: "",
  email: "",
  languages: ["Français"],
  otherLanguages: "",
  hasSalesExperience: undefined as unknown as FormValues["hasSalesExperience"],
  experienceDetails: "",
  videoUrl: "",
  availability: [],
  motivation: "",
  acceptTerms: false,
};

function CheckGroup({
  legend,
  name,
  options,
  error,
  register,
}: {
  legend: string;
  name: "languages" | "availability";
  options: readonly string[];
  error?: string;
  register: UseFormRegister<FormValues>;
}) {
  const errorId = error ? `${name}-erreur` : undefined;
  return (
    <fieldset aria-describedby={errorId}>
      <legend className="mb-2 text-sm font-semibold">
        {legend}
        <span className="ml-0.5 text-accent-text" aria-hidden>
          *
        </span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition has-checked:border-ocd-orange has-checked:bg-ocd-cream has-focus-visible:outline-2 has-focus-visible:outline-ocd-orange-dark dark:has-checked:bg-ocd-orange/10"
          >
            <Checkbox value={opt} className="mt-0" {...register(name)} />
            {opt}
          </label>
        ))}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

export function CandidatureForm() {
  const [honeypot, setHoneypot] = useState("");
  const [result, setResult] = useState<(SendResult & { reference: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(candidatureFormSchema), defaultValues, mode: "onTouched" });

  const hasExperience = watch("hasSalesExperience") === "oui";
  const viaWhatsApp = usesWhatsApp(clientProvider);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    const reference = generateReference("CAND");
    const res = await sendCandidature({ reference, createdAt: new Date().toISOString(), data }, { honeypot });
    if (!res.ok) {
      setError(res.error ?? "L'envoi a échoué. Réessaie.");
      return;
    }
    setResult({ ...res, reference });
    window.scrollTo({ top: document.getElementById("postuler")?.offsetTop ?? 0, behavior: "smooth" });
  };

  if (result) {
    return (
      <div role="status" className="space-y-5 rounded-[2rem] border border-border bg-card p-6 text-center glow-strong sm:p-10">
        <CheckCircle2 className="mx-auto size-14 text-whatsapp" aria-hidden />
        <h3 className="text-2xl font-extrabold">Merci, ta candidature est prête !</h3>
        <p className="text-muted-foreground">
          {viaWhatsApp
            ? "Envoie le message dans WhatsApp pour finaliser. L'équipe OCD Live te recontacte pour un essai au studio."
            : "Ta candidature est bien envoyée. L'équipe OCD Live te recontacte sur WhatsApp."}
        </p>
        <p className="font-display text-lg font-bold">
          Référence : <span className="text-accent-text">{result.reference}</span>
        </p>
        {result.whatsappUrl && (
          <Button asChild variant="whatsapp" size="lg" className="w-full whitespace-normal sm:w-auto">
            <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              {result.whatsappBlocked ? "Ouvrir WhatsApp pour envoyer" : "Rouvrir WhatsApp"}
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 rounded-[2rem] border border-border bg-card p-5 glow-card sm:p-8">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field id="cand-fullName" label="Nom complet" required error={errors.fullName?.message}>
          {(p) => <Input {...p} autoComplete="name" {...register("fullName")} />}
        </Field>
        <Field id="cand-age" label="Âge" required error={errors.age?.message}>
          {(p) => <Input {...p} inputMode="numeric" maxLength={2} placeholder="Ex. 24" {...register("age")} />}
        </Field>
      </div>
      <Field id="cand-location" label="Quartier et ville" required error={errors.location?.message}>
        {(p) => <Input {...p} placeholder="Ex. Adidogomé, Lomé" {...register("location")} />}
      </Field>
      <PhoneField
        id="cand-phone"
        control={control}
        countryName="phoneCountry"
        numberRegister={register("phoneNumber")}
        countryError={errors.phoneCountry?.message}
        numberError={errors.phoneNumber?.message}
      />
      <Field id="cand-email" label="Email" hint="Pour recevoir l'accusé de réception de ta candidature." error={errors.email?.message}>
        {(p) => <Input {...p} type="email" inputMode="email" autoComplete="email" placeholder="toi@exemple.com" {...register("email")} />}
      </Field>

      <CheckGroup legend="Langues parlées" name="languages" options={LANGUAGES} error={errors.languages?.message} register={register} />
      <Field id="cand-otherLanguages" label="Autres langues" error={errors.otherLanguages?.message}>
        {(p) => <Input {...p} placeholder="Ex. Kotokoli, haoussa…" {...register("otherLanguages")} />}
      </Field>

      <fieldset aria-describedby={errors.hasSalesExperience ? "exp-erreur" : undefined}>
        <legend className="mb-2 text-sm font-semibold">
          As-tu déjà vendu (marché, boutique, en ligne…) ?<span className="ml-0.5 text-accent-text" aria-hidden>*</span>
        </legend>
        <div className="flex gap-2">
          {(["oui", "non"] as const).map((v) => (
            <label
              key={v}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-medium capitalize has-checked:border-ocd-orange has-checked:bg-ocd-cream has-focus-visible:outline-2 has-focus-visible:outline-ocd-orange-dark dark:has-checked:bg-ocd-orange/10"
            >
              <input type="radio" value={v} className="control-radio" {...register("hasSalesExperience")} />
              {v}
            </label>
          ))}
        </div>
        <FieldError id="exp-erreur" message={errors.hasSalesExperience?.message} />
      </fieldset>
      {hasExperience && (
        <Field id="cand-experience" label="Parle-nous de ton expérience" required error={errors.experienceDetails?.message}>
          {(p) => <Textarea {...p} rows={3} placeholder="Ex. 2 ans vendeuse de pagnes au Grand Marché…" {...register("experienceDetails")} />}
        </Field>
      )}

      <Field
        id="cand-video"
        label="Lien vers ta vidéo de présentation"
        hint="Une courte vidéo (30 s à 1 min) où tu te présentes et vends un objet de ton choix : TikTok, Google Drive, YouTube…"
        error={errors.videoUrl?.message}
      >
        {(p) => <Input {...p} type="url" inputMode="url" placeholder="https://…" {...register("videoUrl")} />}
      </Field>

      <CheckGroup legend="Disponibilités" name="availability" options={AVAILABILITIES} error={errors.availability?.message} register={register} />

      <Field id="cand-motivation" label="Pourquoi veux-tu rejoindre OCD Live ?" required error={errors.motivation?.message}>
        {(p) => <Textarea {...p} rows={4} {...register("motivation")} />}
      </Field>

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="cand-website">Ne pas remplir</label>
        <input id="cand-website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <Checkbox aria-invalid={Boolean(errors.acceptTerms)} {...register("acceptTerms")} />
          <span>
            J&apos;accepte que mes informations soient utilisées pour traiter ma candidature (
            <Link href="/confidentialite" target="_blank" className="font-semibold text-accent-text underline underline-offset-4">
              confidentialité
            </Link>
            ).<span className="text-accent-text" aria-hidden> *</span>
          </span>
        </label>
        <FieldError message={errors.acceptTerms?.message} />
      </div>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      )}

      <Button type="submit" variant={viaWhatsApp ? "whatsapp" : "default"} size="lg" className="w-full whitespace-normal" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" aria-hidden /> : viaWhatsApp ? <WhatsAppIcon /> : null}
        {viaWhatsApp ? "Envoyer ma candidature sur WhatsApp" : "Envoyer ma candidature"}
      </Button>
    </form>
  );
}
