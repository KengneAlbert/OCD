"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { countries, countryGroups } from "@/config/countries";
import { FieldError, Input, Label, Select } from "@/components/ui/form-controls";

/** Drapeau emoji à partir du code ISO (ex. « TG » → 🇹🇬). */
export function flagEmoji(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function CountryOptions({ withDial = false }: { withDial?: boolean }) {
  return (
    <>
      {countryGroups.map((group) => (
        <optgroup key={group.region} label={group.label}>
          {countries
            .filter((c) => c.region === group.region)
            .map((c) => (
              <option key={c.code} value={c.code}>
                {withDial ? `${flagEmoji(c.code)} ${c.dialCode} · ${c.name}` : `${flagEmoji(c.code)} ${c.name}`}
              </option>
            ))}
        </optgroup>
      ))}
    </>
  );
}

/** Téléphone WhatsApp : indicatif pays (Togo par défaut) + numéro. */
export function PhoneField({
  id,
  countryRegister,
  numberRegister,
  countryError,
  numberError,
  label = "Téléphone WhatsApp",
}: {
  id: string;
  countryRegister: UseFormRegisterReturn;
  numberRegister: UseFormRegisterReturn;
  countryError?: string;
  numberError?: string;
  label?: string;
}) {
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
        <div className="w-[7.5rem] shrink-0 sm:w-44">
          <Select
            aria-label="Indicatif pays"
            aria-invalid={Boolean(countryError)}
            autoComplete="tel-country-code"
            {...countryRegister}
          >
            <CountryOptions withDial />
          </Select>
        </div>
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
