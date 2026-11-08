"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categories, OTHER_CATEGORY_ID, productCountOptions } from "@/config/categories";
import { DEFAULT_COUNTRY_CODE } from "@/config/countries";
import { CountryOptions, PhoneField } from "@/components/forms/phone-field";
import { Checkbox, Field, FieldError, Input, Select, Textarea } from "@/components/ui/form-controls";
import { createInfoSchema, emptyInfo, type ReservationInfo } from "@/lib/validation/reservation";
import { useBooking } from "./booking-provider";
import { StepShell } from "./step-shell";

export const INFO_FORM_ID = "booking-info-form";

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-6">
      <legend className="px-1 font-display text-lg font-bold">{title}</legend>
      {children}
    </fieldset>
  );
}

export function StepInfo() {
  const { state, update, next, emailRequired } = useBooking();
  const distance = state.liveType === "distance";

  const schema = useMemo(() => createInfoSchema({ liveType: state.liveType, emailRequired }), [state.liveType, emailRequired]);

  const form = useForm<ReservationInfo>({
    resolver: zodResolver(schema),
    defaultValues: { ...emptyInfo, phoneCountry: DEFAULT_COUNTRY_CODE, ...state.info },
    mode: "onTouched",
  });
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors },
  } = form;

  // Brouillon sauvegardé (debounce) pour ne rien perdre en revenant en arrière.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateRef = useRef(update);
  updateRef.current = update;
  useEffect(() => {
    const sub = watch((values) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => updateRef.current({ info: values as Partial<ReservationInfo> }), 400);
    });
    return () => {
      sub.unsubscribe();
      if (timer.current) clearTimeout(timer.current);
      updateRef.current({ info: getValues() });
    };
  }, [watch, getValues]);

  const category = watch("category");

  const onSubmit = (values: ReservationInfo) => {
    if (timer.current) clearTimeout(timer.current);
    next({ info: values });
  };

  return (
    <StepShell title="Parle-nous de toi et de ton business" description="Ces informations seront affichées ou annoncées pendant ton live. Les champs marqués * sont obligatoires.">
      <form id={INFO_FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <FormSection title="Toi et ton business">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="fullName" label="Nom complet" required error={errors.fullName?.message}>
              {(p) => <Input {...p} autoComplete="name" placeholder="Ex. Ama Koffi" {...register("fullName")} />}
            </Field>
            <Field id="businessName" label="Nom du business" required error={errors.businessName?.message}>
              {(p) => <Input {...p} autoComplete="organization" placeholder="Ex. Ama Délices" {...register("businessName")} />}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="category" label="Catégorie d'activité" required error={errors.category?.message}>
              {(p) => (
                <Select {...p} {...register("category")}>
                  <option value="">Choisis ta catégorie…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                  <option value={OTHER_CATEGORY_ID}>Autre</option>
                </Select>
              )}
            </Field>
            {category === OTHER_CATEGORY_ID && (
              <Field id="categoryOther" label="Précise ton activité" required error={errors.categoryOther?.message}>
                {(p) => <Input {...p} placeholder="Ex. Location de voitures" {...register("categoryOther")} />}
              </Field>
            )}
          </div>
          <Field
            id="productDescription"
            label="Produit(s) ou service à présenter"
            required
            hint="Ce que tu vas montrer en live, en quelques phrases."
            error={errors.productDescription?.message}
          >
            {(p) => <Textarea {...p} placeholder="Ex. Jus de bissap, gingembre et baobab en bouteilles de 50 cl, pâtisseries maison…" {...register("productDescription")} />}
          </Field>
          <Field id="productCount" label="Nombre de produits à présenter" error={errors.productCount?.message}>
            {(p) => (
              <Select {...p} {...register("productCount")}>
                <option value="">Je ne sais pas encore</option>
                {productCountOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </FormSection>

        <FormSection title="Contact">
          <PhoneField
            id="phoneNumber"
            countryRegister={register("phoneCountry")}
            numberRegister={register("phoneNumber")}
            countryError={errors.phoneCountry?.message}
            numberError={errors.phoneNumber?.message}
          />
          <Field
            id="email"
            label="Email"
            required={emailRequired}
            hint={emailRequired ? "Tu recevras la confirmation par email." : "Pour recevoir aussi les infos par email."}
            error={errors.email?.message}
          >
            {(p) => <Input {...p} type="email" inputMode="email" autoComplete="email" placeholder="toi@exemple.com" {...register("email")} />}
          </Field>
        </FormSection>

        <FormSection title={distance ? "D'où fais-tu ton live ?" : "Ta boutique"}>
          {distance && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="country" label="Pays" required error={errors.country?.message}>
                {(p) => (
                  <Select {...p} autoComplete="country" {...register("country")}>
                    <option value="">Choisis ton pays…</option>
                    <CountryOptions />
                  </Select>
                )}
              </Field>
              <Field id="city" label="Ville" required error={errors.city?.message}>
                {(p) => <Input {...p} autoComplete="address-level2" placeholder="Ex. Abidjan" {...register("city")} />}
              </Field>
            </div>
          )}
          <Field
            id="shopAddress"
            label="Adresse de la boutique"
            hint="Affichée pendant le live pour que tes clients te trouvent."
            error={errors.shopAddress?.message}
          >
            {(p) => <Input {...p} autoComplete="street-address" placeholder="Ex. Marché de Bè, allée 4, Lomé" {...register("shopAddress")} />}
          </Field>
        </FormSection>

        <FormSection title="Tes réseaux sociaux">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="tiktok" label="TikTok" error={errors.tiktok?.message}>
              {(p) => <Input {...p} placeholder="@tonbusiness" {...register("tiktok")} />}
            </Field>
            <Field id="facebook" label="Facebook" error={errors.facebook?.message}>
              {(p) => <Input {...p} placeholder="Lien ou nom de page" {...register("facebook")} />}
            </Field>
            <Field id="instagram" label="Instagram" error={errors.instagram?.message}>
              {(p) => <Input {...p} placeholder="@tonbusiness" {...register("instagram")} />}
            </Field>
          </div>
        </FormSection>

        <FormSection title="Un dernier mot">
          <Field id="specialNeeds" label="Besoins particuliers" hint="Matériel, mise en scène, question… dis-nous tout." error={errors.specialNeeds?.message}>
            {(p) => <Textarea {...p} rows={3} placeholder="Ex. J'aurai besoin d'une table pour exposer mes tissus." {...register("specialNeeds")} />}
          </Field>
          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                aria-invalid={Boolean(errors.acceptTerms)}
                aria-describedby={errors.acceptTerms ? "acceptTerms-erreur" : undefined}
                {...register("acceptTerms")}
              />
              <span>
                J&apos;accepte les{" "}
                <Link href="/mentions-legales#conditions" target="_blank" className="font-semibold text-accent-text underline underline-offset-4">
                  conditions de réservation
                </Link>{" "}
                et la{" "}
                <Link href="/confidentialite" target="_blank" className="font-semibold text-accent-text underline underline-offset-4">
                  politique de confidentialité
                </Link>
                .<span className="text-accent-text" aria-hidden> *</span>
              </span>
            </label>
            <FieldError id="acceptTerms-erreur" message={errors.acceptTerms?.message} />
          </div>
        </FormSection>
      </form>
    </StepShell>
  );
}
