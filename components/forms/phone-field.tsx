"use client";

import { useMemo } from "react";
import { useController, type Control, type FieldValues, type Path, type UseFormRegisterReturn } from "react-hook-form";
import { FieldError, Input, Label } from "@/components/ui/form-controls";
import { SelectMenu } from "@/components/ui/select-menu";
import { countryOptions } from "./options";

export { flagEmoji } from "./options";

/** Téléphone WhatsApp : indicatif pays (Togo par défaut, avec recherche) + numéro. */
export function PhoneField<T extends FieldValues>({
  id,
  control,
  countryName,
  numberRegister,
  countryError,
  numberError,
  label = "Téléphone WhatsApp",
}: {
  id: string;
  control: Control<T>;
  countryName: Path<T>;
  numberRegister: UseFormRegisterReturn;
  countryError?: string;
  numberError?: string;
  label?: string;
}) {
  const { field } = useController({ control, name: countryName });
  const options = useMemo(() => countryOptions(true), []);
  const error = countryError ?? numberError;
  const errorId = error ? `${id}-erreur` : undefined;
  const hintId = `${id}-aide`;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        <span className="ml-0.5 text-accent-text" aria-hidden>
          *
        </span>
      </Label>
      <div className="flex gap-2">
        <SelectMenu
          aria-label="Indicatif pays"
          aria-invalid={Boolean(countryError)}
          value={field.value as string}
          onChange={field.onChange}
          onBlur={field.onBlur}
          options={options}
          searchable
          searchPlaceholder="Pays ou indicatif…"
          compact
          className="w-[7.75rem] shrink-0 sm:w-36"
          panelClassName="w-[19rem]"
        />
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="90 00 00 00"
          aria-required
          aria-invalid={Boolean(numberError)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ")}
          {...numberRegister}
        />
      </div>
      {!error && (
        <p id={hintId} className="text-sm text-muted-foreground">
          Le numéro sur lequel l&apos;équipe te confirme tout.
        </p>
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
