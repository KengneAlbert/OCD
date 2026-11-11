"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardPaste, Loader2, Send, Square } from "lucide-react";
import { countryOptions } from "@/components/forms/options";
import { Flag } from "@/components/ui/flag";
import { Field, Input } from "@/components/ui/form-controls";
import { SelectMenu } from "@/components/ui/select-menu";
import { categories, DEFAULT_CATEGORY, getCategory } from "@/config/live-categories";
import { getCountry } from "@/config/countries";
import { endMyLiveAction, saveProfileAction, submitLiveAction, type EspaceState } from "@/lib/espace/actions";
import { cn } from "@/lib/utils";

const bigButton =
  "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-6 text-lg font-semibold transition disabled:opacity-60";

function Feedback({ state }: { state: EspaceState }) {
  if (!state.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "rounded-2xl px-4 py-3 text-base font-medium",
        state.ok ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" : "bg-red-500/10 text-red-800 dark:text-red-200",
      )}
    >
      {state.message}
    </p>
  );
}

/** Grille de catégories à icônes (un tap). */
function CategoryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Ce que tu vends" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {categories.map((c) => (
        <button
          key={c.slug}
          type="button"
          role="radio"
          aria-checked={value === c.slug}
          onClick={() => onChange(c.slug)}
          className={cn(
            "flex min-h-14 items-center gap-2 rounded-2xl border-2 px-3 text-left text-base font-semibold transition",
            value === c.slug ? "border-ocd-orange bg-ocd-orange/15" : "border-border hover:bg-muted",
          )}
        >
          <span aria-hidden className="text-2xl leading-none">
            {c.emoji}
          </span>
          {c.label}
        </button>
      ))}
    </div>
  );
}

export interface ProfileDefaults {
  fullName?: string;
  businessName?: string;
  country?: string;
  city?: string | null;
  category?: string;
  tiktok?: string | null;
  phone?: string;
}

export function ProfileForm({ defaults, submitLabel = "Enregistrer" }: { defaults?: ProfileDefaults; submitLabel?: string }) {
  const [state, action, pending] = useActionState(saveProfileAction, {});
  const [country, setCountry] = useState(defaults?.country ?? "TG");
  const [category, setCategory] = useState(defaults?.category ?? DEFAULT_CATEGORY);
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input type="hidden" name="category" value={category} />
      <Field id="p-business" label="🏪 Nom du business" required>
        {(p) => <Input {...p} name="businessName" defaultValue={defaults?.businessName} required />}
      </Field>
      <Field id="p-name" label="🙂 Ton nom" required>
        {(p) => <Input {...p} name="fullName" defaultValue={defaults?.fullName} autoComplete="name" required />}
      </Field>
      <Field id="p-country" label="🌍 Pays" required>
        {(p) => <SelectMenu {...p} name="country" value={country} onChange={setCountry} options={countryOptions()} searchable />}
      </Field>
      <Field id="p-city" label="📍 Ville">
        {(p) => <Input {...p} name="city" defaultValue={defaults?.city ?? ""} placeholder="Lomé" autoComplete="address-level2" />}
      </Field>
      <div className="sm:col-span-2">
        <p className="mb-2 text-base font-semibold">🛍️ Tu vends quoi ?</p>
        <CategoryPicker value={category} onChange={setCategory} />
      </div>
      <Field id="p-phone" label="💬 WhatsApp" hint="Les clients t'écrivent ici">
        {(p) => <Input {...p} name="phone" defaultValue={defaults?.phone} inputMode="tel" autoComplete="tel-national" />}
      </Field>
      <Field id="p-tiktok" label="🎵 Compte TikTok" required>
        {(p) => (
          <Input {...p} name="tiktok" defaultValue={defaults?.tiktok ? `@${defaults.tiktok}` : ""} placeholder="@maboutique" autoCapitalize="none" required />
        )}
      </Field>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <Feedback state={state} />
        <button type="submit" disabled={pending} className={cn(bigButton, "bg-ocd-black text-white hover:bg-ocd-orange hover:text-ocd-black sm:w-fit dark:bg-white dark:text-ocd-black")}>
          {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

/** « Je suis en live » : coller le lien → envoyer. Pays et catégorie pré-remplis. */
export function LiveForm({ defaultCountry, defaultCategory }: { defaultCountry: string; defaultCategory: string }) {
  const [state, action, pending] = useActionState(submitLiveAction, {});
  const [url, setUrl] = useState("");
  const [country, setCountry] = useState(defaultCountry);
  const [category, setCategory] = useState(defaultCategory);
  const [editing, setEditing] = useState<"country" | "category" | null>(null);
  const [pasteError, setPasteError] = useState(false);

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
      setPasteError(false);
    } catch {
      setPasteError(true);
    }
  };

  if (state.ok) {
    return (
      <div role="status" className="rounded-[2rem] bg-emerald-500/10 p-8 text-center">
        <CheckCircle2 className="mx-auto size-16 text-emerald-600" aria-hidden />
        <p className="mt-4 text-2xl font-semibold">Envoyé !</p>
        <p className="mt-1 text-lg">L&apos;équipe vérifie ton live.</p>
        <Link href="/moi" className="mt-6 inline-flex min-h-14 items-center justify-center rounded-full border-2 border-border px-6 text-lg font-semibold hover:bg-muted">
          👤 Mon espace
        </Link>
      </div>
    );
  }

  const cat = getCategory(category);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="country" value={country} />
      <input type="hidden" name="category" value={category} />

      <div>
        <label htmlFor="live-url" className="mb-2 block text-lg font-semibold">
          🔗 Lien de ton live TikTok
        </label>
        <div className="flex gap-2">
          <input
            id="live-url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
            autoComplete="off"
            placeholder="tiktok.com/@…"
            required
            className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-border bg-background px-4 text-lg focus:border-ocd-orange focus:outline-none"
          />
          <button type="button" onClick={paste} className="inline-flex h-14 shrink-0 items-center gap-2 rounded-2xl bg-ocd-orange px-4 text-lg font-semibold text-ocd-black">
            <ClipboardPaste className="size-5" aria-hidden /> Coller
          </button>
        </div>
        {pasteError && <p className="mt-2 text-base text-muted-foreground">Appuie longtemps dans la case, puis « Coller ».</p>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setEditing(editing === "country" ? null : "country")}
          aria-expanded={editing === "country"}
          className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-border px-3 text-left text-base font-semibold hover:bg-muted"
        >
          <Flag code={country} className="h-5" />
          <span className="truncate">{getCountry(country)?.name}</span>
        </button>
        <button
          type="button"
          onClick={() => setEditing(editing === "category" ? null : "category")}
          aria-expanded={editing === "category"}
          className="flex min-h-14 items-center gap-2 rounded-2xl border-2 border-border px-3 text-left text-base font-semibold hover:bg-muted"
        >
          <span aria-hidden className="text-2xl">
            {cat?.emoji}
          </span>
          <span className="truncate">{cat?.label}</span>
        </button>
      </div>
      {editing === "country" && (
        <SelectMenu
          id="live-country"
          name="country-select"
          value={country}
          onChange={(v) => {
            setCountry(v);
            setEditing(null);
          }}
          options={countryOptions()}
          searchable
        />
      )}
      {editing === "category" && (
        <CategoryPicker
          value={category}
          onChange={(v) => {
            setCategory(v);
            setEditing(null);
          }}
        />
      )}

      <Feedback state={state} />
      <button type="submit" disabled={pending || !url.trim()} className={cn(bigButton, "bg-red-600 text-white hover:bg-red-700")}>
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
        Envoyer
      </button>
    </form>
  );
}

export function EndLiveButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(endMyLiveAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className={cn(bigButton, "border-2 border-border hover:bg-muted")}>
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Square className="size-5" aria-hidden />}
        Terminé
      </button>
      {state.message && !state.ok && <p className="mt-2 text-base text-red-700">{state.message}</p>}
    </form>
  );
}
