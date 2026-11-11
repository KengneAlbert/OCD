"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { categories } from "@/config/live-categories";
import { marketplaceConfig } from "@/config/marketplace";
import { deleteProductAction, saveProductAction, toggleProductAction, type ProductState } from "@/lib/marketplace/actions";
import { cn } from "@/lib/utils";

/** Réduit la photo (côté max 1200 px, JPEG 82 %) pour les connexions lentes. */
async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, marketplaceConfig.imageMaxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

function Feedback({ state }: { state: ProductState }) {
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

export interface ProductDefaults {
  id?: string;
  title?: string;
  description?: string | null;
  price?: number | null;
  kind?: "produit" | "service";
  category?: string;
  imageUrl?: string | null;
}

/** Ajouter / modifier : photo → prix → nom (le reste est facultatif). */
export function ProductForm({ defaults, defaultCategory }: { defaults?: ProductDefaults; defaultCategory: string }) {
  const [state, action, pending] = useActionState(saveProductAction, {});
  const [preview, setPreview] = useState<string | null>(defaults?.imageUrl ?? null);
  const [kind, setKind] = useState<"produit" | "service">(defaults?.kind ?? "produit");
  const [category, setCategory] = useState(defaults?.category ?? defaultCategory);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const field = "h-14 w-full rounded-2xl border-2 border-border bg-background px-4 text-lg focus:border-ocd-orange focus:outline-none";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const file = fileRef.current?.files?.[0];
    fd.delete("image");
    if (file) fd.set("image", await compress(file), "photo.jpg");
    setBusy(false);
    startTransition(() => action(fd));
  };

  const working = pending || busy;
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {defaults?.id && <input type="hidden" name="id" value={defaults.id} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="category" value={category} />

      {/* 1. Photo */}
      <div>
        <p className="mb-2 text-lg font-semibold">Photo</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex aspect-[4/5] w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/50 transition hover:border-ocd-orange"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:)
            <img src={preview} alt="Aperçu de la photo" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="size-10" aria-hidden />
              <span className="text-base font-semibold">Prendre ou choisir</span>
            </span>
          )}
          {preview && <span className="absolute right-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">Changer</span>}
        </button>
        <input
          ref={fileRef}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label="Photo du produit"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPreview(URL.createObjectURL(f));
          }}
        />
      </div>

      {/* 2. Prix */}
      <div>
        <label htmlFor="p-price" className="mb-2 block text-lg font-semibold">
          Prix (FCFA)
        </label>
        <input id="p-price" name="price" inputMode="numeric" defaultValue={defaults?.price ?? ""} placeholder="Vide = prix sur demande" className={field} />
      </div>

      {/* 3. Nom */}
      <div>
        <label htmlFor="p-title" className="mb-2 block text-lg font-semibold">
          Nom
        </label>
        <input id="p-title" name="title" required maxLength={80} defaultValue={defaults?.title} placeholder="Ex. Pagne wax 6 yards" className={field} />
      </div>

      <details className="rounded-2xl border border-border p-4" open={Boolean(defaults?.id)}>
        <summary className="cursor-pointer text-base font-semibold">Plus de détails</summary>
        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type">
            {(["produit", "service"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={cn("h-12 rounded-2xl border-2 text-base font-semibold", kind === k ? "border-ocd-orange bg-ocd-orange/15" : "border-border")}
              >
                {k === "produit" ? "Produit" : "Prestation"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Catégorie">
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="radio"
                aria-checked={category === c.slug}
                onClick={() => setCategory(c.slug)}
                className={cn("h-10 rounded-full border-2 px-3 text-sm font-semibold", category === c.slug ? "border-ocd-orange bg-ocd-orange/15" : "border-border")}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="p-desc" className="mb-2 block text-base font-semibold">
              Description
            </label>
            <textarea
              id="p-desc"
              name="description"
              rows={3}
              maxLength={500}
              defaultValue={defaults?.description ?? ""}
              placeholder="Tailles, couleurs, livraison…"
              className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-base focus:border-ocd-orange focus:outline-none"
            />
          </div>
        </div>
      </details>

      <Feedback state={state} />
      <button
        type="submit"
        disabled={working}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-lg font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {working && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {defaults?.id ? "Enregistrer" : "Publier"}
      </button>
    </form>
  );
}

/** Masquer / réafficher et supprimer (sur la page de modification). */
export function ProductDangerZone({ id, visible }: { id: string; visible: boolean }) {
  const [tState, toggle, tPending] = useActionState(toggleProductAction, {});
  const [, remove, dPending] = useActionState(deleteProductAction, {});
  return (
    <div className="flex flex-wrap items-center gap-3">
      <form action={toggle}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={tPending} className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-5 font-semibold hover:bg-muted">
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          {visible ? "Masquer" : "Rendre visible"}
        </button>
      </form>
      <form
        action={remove}
        onSubmit={(e) => {
          if (!window.confirm("Supprimer ce produit ?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={dPending} className="inline-flex h-12 items-center gap-2 rounded-full px-5 font-semibold text-red-700 hover:bg-red-500/10 dark:text-red-300">
          <Trash2 className="size-4" aria-hidden /> Supprimer
        </button>
      </form>
      {tState.message && <span className="text-sm text-muted-foreground">{tState.message}</span>}
    </div>
  );
}

/** Vignette de produit dans « Mes produits ». */
export function MyProductThumb({ src }: { src: string | null }) {
  return (
    <span className="relative block aspect-square w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
      {src && <Image src={src} alt="" fill sizes="64px" className="object-cover" />}
    </span>
  );
}
