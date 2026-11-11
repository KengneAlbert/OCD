"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Square, X } from "lucide-react";
import { livesConfig } from "@/config/lives";
import { reviewLiveAction, subscriberAction, type LiveActionState } from "@/lib/admin/lives-actions";
import { cn } from "@/lib/utils";

function Msg({ state }: { state: LiveActionState }) {
  if (!state.message) return null;
  return <span className={cn("text-sm font-medium", state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")}>{state.message}</span>;
}

/** Valider / refuser un live en attente (refus : motif en un tap). */
export function ReviewLiveButtons({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reviewLiveAction, {});
  const [refusing, setRefusing] = useState(false);
  if (state.ok) return <Msg state={state} />;
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {refusing ? (
        <>
          <input type="hidden" name="decision" value="refuse" />
          {livesConfig.rejectReasons.map((r) => (
            <button
              key={r}
              type="submit"
              name="reason"
              value={r}
              disabled={pending}
              className="inline-flex h-11 items-center rounded-full bg-foreground px-4 text-sm font-semibold text-background disabled:opacity-60"
            >
              {r}
            </button>
          ))}
          <button type="button" onClick={() => setRefusing(false)} className="h-11 px-2 text-sm text-muted-foreground hover:text-foreground">
            Annuler
          </button>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        </>
      ) : (
        <>
          <button
            type="submit"
            name="decision"
            value="valide"
            disabled={pending}
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Check className="size-4" aria-hidden />} Valider
          </button>
          <button
            type="button"
            onClick={() => setRefusing(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted"
          >
            <X className="size-4" aria-hidden /> Refuser
          </button>
        </>
      )}
      <Msg state={state} />
    </form>
  );
}

export function EndLiveAdminButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(reviewLiveAction, {});
  if (state.ok) return <Msg state={state} />;
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        name="decision"
        value="termine"
        disabled={pending}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted"
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Square className="size-3.5" aria-hidden />} Terminé
      </button>
      <Msg state={state} />
    </form>
  );
}

/** Actions sur un abonné : activer 30 jours (paiement hors ligne), suspendre / réactiver. */
export function SubscriberButtons({ id, suspended }: { id: string; suspended: boolean }) {
  const [state, action, pending] = useActionState(subscriberAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        name="action"
        value="offrir"
        disabled={pending}
        className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        title="Prolonger de 30 jours (paiement hors ligne, geste commercial)"
      >
        +30 j
      </button>
      <button
        type="submit"
        name="action"
        value={suspended ? "reactiver" : "suspendre"}
        disabled={pending}
        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        {suspended ? "Réactiver" : "Suspendre"}
      </button>
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      <Msg state={state} />
    </form>
  );
}
