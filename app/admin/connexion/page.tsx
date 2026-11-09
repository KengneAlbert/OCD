import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ocd-black p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-3xl font-bold tracking-tight text-ocd-orange">
          OCD <span className="accent font-normal text-white">live</span>
        </p>
        <div aria-hidden className="absolute -right-24 -bottom-24 size-[28rem] animate-breathe rounded-full bg-ocd-orange/30 blur-3xl" />
        <div className="relative">
          <p className="font-mono text-[11px] tracking-[0.2em] text-white/50 uppercase">Espace équipe</p>
          <h1 className="mt-4 text-6xl leading-[0.95] font-semibold tracking-tight">
            Chaque live,
            <br />
            <span className="accent font-normal text-ocd-orange">suivi.</span>
          </h1>
          <p className="mt-6 max-w-sm text-white/60">Réservations, candidatures, emails envoyés : tout l&apos;historique au même endroit.</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <p className="text-3xl font-bold tracking-tight text-ocd-orange lg:hidden">
            OCD <span className="accent font-normal text-foreground">live</span>
          </p>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight lg:mt-0">Connexion</h2>
          <p className="mt-2 text-muted-foreground">Réservé à l&apos;équipe OCD Live.</p>
          {configured ? (
            <LoginForm suite={suite} />
          ) : (
            <div className="mt-8 rounded-2xl border border-ocd-orange/40 bg-ocd-cream p-5 text-sm dark:bg-white/5">
              <p className="font-semibold">Supabase n&apos;est pas encore configuré.</p>
              <p className="mt-2 text-muted-foreground">
                Ajoute <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code> et{" "}
                <code>ADMIN_EMAILS</code> dans les variables d&apos;environnement, puis redémarre le serveur. Voir le README.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
