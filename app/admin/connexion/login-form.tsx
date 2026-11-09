"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Field, Input } from "@/components/ui/form-controls";
import { signInAction } from "@/lib/admin/actions";

export function LoginForm({ suite }: { suite?: string }) {
  const [state, action, pending] = useActionState(signInAction, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="suite" value={suite ?? ""} />
      <Field id="login-email" label="Email" required>
        {(p) => <Input {...p} name="email" type="email" autoComplete="email" required />}
      </Field>
      <Field id="login-password" label="Mot de passe" required>
        {(p) => <Input {...p} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      {state.message && (
        <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-800 dark:text-red-200">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ocd-black font-semibold text-white transition hover:bg-ocd-orange hover:text-ocd-black disabled:opacity-60 dark:bg-white dark:text-ocd-black"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Se connecter
      </button>
    </form>
  );
}
