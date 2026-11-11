"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { setRecruitmentAction } from "@/lib/admin/settings-actions";
import { cn } from "@/lib/utils";

/** Interrupteur « Recrutement ouvert » : onglet du menu, page /recrutement et formulaire de candidature. */
export function RecruitmentToggle({ open }: { open: boolean }) {
  const [state, action, pending] = useActionState(setRecruitmentAction, {});
  return (
    <form action={action} className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <input type="hidden" name="open" value={open ? "0" : "1"} />
      <div>
        <p className="font-semibold">Recrutement {open ? "ouvert" : "fermé"}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {open
            ? "L'onglet « Recrutement » est dans le menu du site et les candidatures sont acceptées."
            : "L'onglet est retiré du menu ; la page /recrutement indique qu'il n'y a pas de recrutement en cours."}
        </p>
        {state.message && !state.ok && <p className="mt-1 text-sm text-red-700 dark:text-red-300">{state.message}</p>}
      </div>
      <button
        type="submit"
        role="switch"
        aria-checked={open}
        aria-label={open ? "Fermer le recrutement" : "Ouvrir le recrutement"}
        disabled={pending}
        className="inline-flex shrink-0 items-center gap-3 self-start rounded-full text-sm font-semibold sm:self-auto"
      >
        <span className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition", open ? "bg-emerald-600" : "bg-muted-foreground/30")}>
          <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", open ? "translate-x-6" : "translate-x-1")} />
        </span>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : open ? "Activé" : "Désactivé"}
      </button>
    </form>
  );
}
