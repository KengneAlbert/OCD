"use client";

import { useActionState, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BellRing, Check, Link2, Loader2, RefreshCw, Search, X } from "lucide-react";
import {
  saveNotesAction,
  sendReservationReminderAction,
  updateCandidatureStatusAction,
  updateReservationStatusAction,
  verifyPaymentsAction,
  type ActionState,
} from "@/lib/admin/actions";
import {
  CANDIDATURE_STATUSES,
  candidatureStatusMeta,
  RESERVATION_STATUSES,
  reservationStatusMeta,
  toneClasses,
} from "@/lib/admin/status";
import { SelectMenu, type SelectOption } from "@/components/ui/select-menu";
import { Textarea } from "@/components/ui/form-controls";
import { cn } from "@/lib/utils";

function Feedback({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-medium",
        state.ok ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" : "bg-red-500/10 text-red-800 dark:text-red-200",
      )}
    >
      {state.message}
    </p>
  );
}

function SubmitButton({ pending, children, variant = "dark" }: { pending: boolean; children: React.ReactNode; variant?: "dark" | "orange" | "outline" }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-60",
        variant === "dark" && "bg-ocd-black text-white hover:bg-ocd-orange hover:text-ocd-black dark:bg-white dark:text-ocd-black",
        variant === "orange" && "bg-ocd-orange text-ocd-black hover:bg-ocd-black hover:text-white",
        variant === "outline" && "border border-border hover:bg-muted",
      )}
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

const Dot = ({ tone }: { tone: keyof typeof toneClasses }) => (
  <span aria-hidden className={cn("flex size-6 items-center justify-center rounded-full ring-1 ring-inset", toneClasses[tone])}>
    <span className="size-1.5 rounded-full bg-current" />
  </span>
);

const reservationOptions: SelectOption[] = RESERVATION_STATUSES.map((s) => ({
  value: s,
  label: reservationStatusMeta[s].label,
  description: reservationStatusMeta[s].hint,
  leading: <Dot tone={reservationStatusMeta[s].tone} />,
}));

const candidatureOptions: SelectOption[] = CANDIDATURE_STATUSES.map((s) => ({
  value: s,
  label: candidatureStatusMeta[s].label,
  description: candidatureStatusMeta[s].hint,
  leading: <Dot tone={candidatureStatusMeta[s].tone} />,
}));

const EMAIL_ON_STATUS = {
  reservation: new Set(["confirmee", "payee", "realisee", "annulee"]),
  candidature: new Set(["entretien", "retenue", "refusee"]),
};

/** Changement de statut + message optionnel + email automatique au client. */
export function StatusForm({ kind, id, current, hasEmail }: { kind: "reservation" | "candidature"; id: string; current: string; hasEmail: boolean }) {
  const action = kind === "reservation" ? updateReservationStatusAction : updateCandidatureStatusAction;
  const [state, formAction, pending] = useActionState(action, {});
  const [status, setStatus] = useState(current);
  const sendsEmail = EMAIL_ON_STATUS[kind].has(status) && status !== current;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor={`status-${id}`}>
          Nouveau statut
        </label>
        <SelectMenu
          id={`status-${id}`}
          name="status"
          value={status}
          onChange={setStatus}
          options={kind === "reservation" ? reservationOptions : candidatureOptions}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor={`note-${id}`}>
          Message <span className="font-normal text-muted-foreground">(facultatif, inclus dans l&apos;email)</span>
        </label>
        <Textarea id={`note-${id}`} name="note" rows={2} maxLength={500} placeholder="Ex. Pense à venir avec tes produits déjà étiquetés." />
      </div>
      {sendsEmail && (
        <label className={cn("flex items-start gap-3 rounded-2xl bg-muted/60 p-3 text-sm", !hasEmail && "opacity-60")}>
          <input type="checkbox" name="notify" defaultChecked={hasEmail} disabled={!hasEmail} className="control-check mt-0.5" />
          <span>
            {hasEmail ? "Envoyer l'email correspondant au client" : "Pas d'email enregistré : préviens-le sur WhatsApp"}
          </span>
        </label>
      )}
      <Feedback state={state} />
      <SubmitButton pending={pending}>
        <Check className="size-4" aria-hidden /> Mettre à jour
      </SubmitButton>
    </form>
  );
}

export function NotesForm({ entity, id, notes }: { entity: "reservation" | "candidature"; id: string; notes: string | null }) {
  const [state, formAction, pending] = useActionState(saveNotesAction, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="entity" value={entity} />
      <Textarea name="notes" rows={5} defaultValue={notes ?? ""} placeholder="Notes visibles uniquement par l'équipe (paiement, préférences du client…)" />
      <Feedback state={state} />
      <SubmitButton pending={pending} variant="outline">
        Enregistrer les notes
      </SubmitButton>
    </form>
  );
}

export function ReminderButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(sendReservationReminderAction, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending || disabled}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BellRing className="size-4" aria-hidden />}
        Envoyer le rappel J-1
      </button>
      <Feedback state={state} />
    </form>
  );
}

/** Barre de filtres synchronisée avec l'URL. */
export function ListFilters({
  kind,
  showType = false,
  showDates = false,
}: {
  kind: "reservation" | "candidature";
  showType?: boolean;
  showDates?: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const push = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    router.push(`?${next.toString()}`);
  };

  const statusOptions = kind === "reservation" ? reservationOptions : candidatureOptions;
  const hasFilters = ["q", "status", "type", "from", "to"].some((k) => params.get(k));

  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          push({ q: q.trim() || undefined });
        }}
      >
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={kind === "reservation" ? "Référence, nom, business, téléphone…" : "Référence, nom, quartier, téléphone…"}
          aria-label="Rechercher"
          className="h-12 w-full rounded-2xl border border-border bg-card pr-4 pl-11 text-sm outline-none focus-visible:border-ocd-orange-dark focus-visible:ring-4 focus-visible:ring-ocd-glow/70"
        />
      </form>
      <SelectMenu
        aria-label="Filtrer par statut"
        value={params.get("status") ?? ""}
        onChange={(v) => push({ status: v || undefined })}
        options={statusOptions}
        placeholder="Tous les statuts"
        clearable
        className="lg:w-56"
      />
      {showType && (
        <SelectMenu
          aria-label="Filtrer par type"
          value={params.get("type") ?? ""}
          onChange={(v) => push({ type: v || undefined })}
          options={[
            { value: "presentiel", label: "Au studio" },
            { value: "distance", label: "À distance" },
          ]}
          placeholder="Tous les types"
          clearable
          className="lg:w-44"
        />
      )}
      {showDates && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Date du live : à partir du"
            defaultValue={params.get("from") ?? ""}
            onChange={(e) => push({ from: e.target.value || undefined })}
            className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
          />
          <span className="text-muted-foreground">→</span>
          <input
            type="date"
            aria-label="Date du live : jusqu'au"
            defaultValue={params.get("to") ?? ""}
            onChange={(e) => push({ to: e.target.value || undefined })}
            className="h-12 rounded-2xl border border-border bg-card px-3 text-sm"
          />
        </div>
      )}
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.push("?");
          }}
          className="inline-flex h-12 items-center gap-1.5 rounded-2xl px-3 text-sm text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden /> Effacer
        </button>
      )}
    </div>
  );
}

export function VerifyPaymentsButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(verifyPaymentsAction, {});
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <SubmitButton pending={pending} variant="outline">
        <RefreshCw className="size-4" aria-hidden /> Vérifier auprès de Swinmo
      </SubmitButton>
      <Feedback state={state} />
    </form>
  );
}

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* ignore */
        }
      }}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ocd-orange px-5 text-sm font-semibold text-ocd-black transition hover:bg-ocd-black hover:text-white"
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
      {copied ? "Lien copié !" : "Copier le lien de paiement"}
    </button>
  );
}
