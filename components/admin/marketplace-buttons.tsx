"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { moderateProductAction } from "@/lib/admin/marketplace-actions";

export function ModerateProductButtons({ id, hidden }: { id: string; hidden: boolean }) {
  const [state, action, pending] = useActionState(moderateProductAction, {});
  return (
    <form
      action={action}
      className="flex flex-wrap items-center justify-end gap-2"
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "supprimer" && !window.confirm("Supprimer définitivement ce produit ?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" name="action" value={hidden ? "afficher" : "masquer"} disabled={pending} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
        {hidden ? "Réafficher" : "Masquer"}
      </button>
      <button type="submit" name="action" value="supprimer" disabled={pending} className="rounded-full px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-500/10 dark:text-red-300">
        Supprimer
      </button>
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {state.message && !state.ok && <span className="text-xs text-red-700">{state.message}</span>}
    </form>
  );
}
