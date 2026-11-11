"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Field, Input } from "@/components/ui/form-controls";
import { getBrowserClient } from "@/lib/supabase/browser";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

/** Pages vendeur vers lesquelles on peut revenir après la connexion. */
const SUITE_OK = /^\/(moi|je-suis-en-live)(\/|\?|$)/;

/** Connexion des vendeurs : Google, ou lien magique reçu par email (sans mot de passe). */
export function LoginPanel({ suite }: { suite?: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = () => `${window.location.origin}/auth/callback?suite=${encodeURIComponent(suite && SUITE_OK.test(suite) ? suite : "/moi")}`;

  const google = async () => {
    setError(null);
    const sb = getBrowserClient();
    if (!sb) return setError("Connexion indisponible pour le moment.");
    setBusy("google");
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) {
      setBusy(null);
      setError("La connexion avec Google n'est pas encore activée. Utilise ton email.");
    }
  };

  const magicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const sb = getBrowserClient();
    if (!sb) return setError("Connexion indisponible pour le moment.");
    setBusy("email");
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo() } });
    setBusy(null);
    if (error) setError(/rate|limit/i.test(error.message) ? "Trop de demandes : attends une minute et réessaie." : "Envoi impossible. Vérifie ton adresse email.");
    else setSent(true);
  };

  if (sent) {
    return (
      <div role="status" className="rounded-3xl bg-ocd-cream p-6 text-center dark:bg-white/5">
        <Mail className="mx-auto size-10 text-ocd-orange-dark" aria-hidden />
        <p className="mt-3 text-lg font-semibold">Regarde tes emails</p>
        <p className="mt-1 text-sm text-muted-foreground">
          On a envoyé un lien de connexion à <strong>{email}</strong>. Clique dessus depuis ce téléphone ou cet ordinateur.
        </p>
        <button type="button" onClick={() => setSent(false)} className="mt-4 text-sm font-semibold underline underline-offset-4">
          Changer d&apos;adresse
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={google}
        disabled={busy !== null}
        className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full border text-lg border-border bg-card font-semibold transition hover:bg-muted disabled:opacity-60"
      >
        {busy === "google" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <GoogleIcon />}
        Continuer avec Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> ou avec ton email <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={magicLink} className="space-y-3">
        <Field id="espace-email" label="Email" required>
          {(p) => <Input {...p} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />}
        </Field>
        <button
          type="submit"
          disabled={busy !== null}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ocd-black text-lg font-semibold text-white transition hover:bg-ocd-orange hover:text-ocd-black disabled:opacity-60 dark:bg-white dark:text-ocd-black"
        >
          {busy === "email" && <Loader2 className="size-4 animate-spin" aria-hidden />}
          📩 Recevoir mon lien
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-800 dark:text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
