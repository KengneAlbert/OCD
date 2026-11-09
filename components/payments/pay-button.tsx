"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, Lock, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAYMENT_SUMMARY } from "@/config/payment-methods";
import { PaymentLogos } from "./payment-logos";

const INLINE_SRC = "https://pay.swinmo.shop/v1/inline.js";

interface SwinmoResult {
  session_id: string;
  charge_id: string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
}

declare global {
  interface Window {
    SwinmoPay?: {
      init: (options: {
        session: string;
        onSuccess?: (result?: Partial<SwinmoResult>) => void;
        onPending?: (result?: Partial<SwinmoResult>) => void;
        onCancel?: () => void;
        onClose?: () => void;
        onReady?: () => void;
        onError?: (error: { code?: string; message?: string }) => void;
      }) => void;
      close: () => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Charge inline.js une seule fois, à la demande (pas de script tiers sur les autres pages). */
function loadInline(): Promise<void> {
  if (window.SwinmoPay) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = INLINE_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

type Phase = "idle" | "opening" | "open" | "confirming" | "success" | "pending";

export function PayButton({
  token,
  amountLabel,
  autoOpen = false,
  className,
}: {
  token: string;
  amountLabel: string;
  /** Ouvre la fenêtre de paiement dès l'arrivée sur la page (après « Payer et réserver »). */
  autoOpen?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  const confirm = useCallback(
    async (chargeId: string) => {
      setPhase("confirming");
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, chargeId }),
        });
        const json = (await res.json().catch(() => ({}))) as { status?: string };
        setPhase(json.status === "succeeded" ? "success" : "pending");
      } catch {
        // Le webhook prendra le relais : on affiche « en cours de validation ».
        setPhase("pending");
      }
      router.refresh();
    },
    [token, router],
  );

  const pay = async () => {
    setError(null);
    setPhase("opening");
    try {
      const [res] = await Promise.all([
        fetch("/api/payments/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }),
        loadInline(),
      ]);
      const json = (await res.json().catch(() => ({}))) as { sessionId?: string; error?: string };
      if (!res.ok || !json.sessionId) throw new Error(json.error ?? "Impossible d'ouvrir le paiement.");
      if (!window.SwinmoPay) throw new Error("Le module de paiement n'a pas pu se charger.");

      setPhase("open");
      window.SwinmoPay.init({
        session: json.sessionId,
        // La modale se ferme d'elle-même avant onSuccess / onPending / onCancel.
        onSuccess: (result) => (result?.charge_id ? void confirm(result.charge_id) : setPhase("pending")),
        // Fermée pendant la validation sur le téléphone : on vérifie si une charge existe déjà.
        onPending: (result) => (result?.charge_id ? void confirm(result.charge_id) : setPhase("pending")),
        onCancel: () => setPhase("idle"),
        // onError ne ferme PAS la modale (le client peut réessayer dedans) : on garde juste le message.
        onError: (e) => setError(e?.message || "Le paiement a échoué. Tu peux réessayer."),
        onClose: () => setPhase((p) => (p === "open" ? "idle" : p)),
      });
    } catch (e) {
      setPhase("idle");
      setError(
        e instanceof Error && e.message !== "load"
          ? e.message
          : "Le module de paiement n'a pas pu se charger. Vérifie ta connexion et réessaie.",
      );
    }
  };

  // Ouverture automatique une seule fois (le ?go=1 est retiré de l'URL pour ne pas rouvrir au rafraîchissement).
  const opened = useRef(false);
  useEffect(() => {
    if (!autoOpen || opened.current) return;
    opened.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    void pay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  if (phase === "success") {
    return (
      <div role="status" className="rounded-3xl bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <p className="mt-3 text-xl font-semibold">Paiement reçu, ta réservation est validée !</p>
        <p className="mt-1 text-muted-foreground">Ton créneau est à toi. Un email de confirmation t&apos;a été envoyé.</p>
      </div>
    );
  }

  if (phase === "pending") {
    return (
      <div role="status" className="rounded-3xl bg-ocd-cream p-6 text-center dark:bg-white/5">
        <Clock className="mx-auto size-12 text-ocd-orange-dark" aria-hidden />
        <p className="mt-3 text-xl font-semibold">Paiement en cours de validation</p>
        <p className="mt-1 text-muted-foreground">
          Valide l&apos;opération sur ton téléphone si ce n&apos;est pas déjà fait. Tu recevras un email dès que le paiement est confirmé.
        </p>
        <button type="button" onClick={() => router.refresh()} className="mt-4 text-sm font-semibold underline underline-offset-4">
          Actualiser
        </button>
      </div>
    );
  }

  const busy = phase === "opening" || phase === "open" || phase === "confirming";
  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="group inline-flex h-16 w-full items-center justify-center gap-3 rounded-full bg-ocd-orange px-6 text-lg font-semibold text-ocd-black transition hover:bg-ocd-black hover:text-white disabled:opacity-70"
      >
        {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Smartphone className="size-5" aria-hidden />}
        {phase === "confirming" ? "Vérification du paiement…" : busy ? "Ouverture du paiement…" : `Payer ${amountLabel}`}
      </button>
      {error && (
        <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-800 dark:text-red-200">
          {error}
        </p>
      )}
      <PaymentLogos className="pt-1" />
      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <Lock className="size-3.5 shrink-0" aria-hidden /> Paiement sécurisé par Swinmo Pay · {PAYMENT_SUMMARY}
      </p>
    </div>
  );
}
