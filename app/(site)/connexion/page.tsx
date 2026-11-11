import type { Metadata } from "next";
import { Chyron } from "@/components/brand/broadcast";
import { LoginPanel } from "@/components/espace/login-panel";
import { livesConfig } from "@/config/lives";
import { windowsLabel } from "@/lib/lives";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Connexion vendeur",
  description: `Abonne-toi pour ${formatPrice(livesConfig.subscriptionPrice)} par mois et affiche tes lives de vente TikTok sur OCD Live.`,
  robots: { index: false, follow: false },
};

export default async function EspaceLoginPage({ searchParams }: { searchParams: Promise<{ suite?: string; erreur?: string }> }) {
  const { suite, erreur } = await searchParams;
  const perks = [
    "🌍 Vu dans l'annuaire de ton pays",
    "▶️ Les clients te rejoignent en un tap",
    `⏰ Validation ${windowsLabel()}`,
    "🔓 Sans engagement",
  ];
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 pt-10 pb-20 sm:pt-14 lg:grid-cols-2 lg:gap-16">
      <div>
        <Chyron>Espace vendeur</Chyron>
        <h1 className="mt-4 text-[clamp(2.4rem,6vw,3.8rem)] leading-[0.95] font-semibold tracking-tight">
          Sois vu <span className="accent font-normal text-ocd-orange-dark dark:text-ocd-orange">en live.</span>
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">{formatPrice(livesConfig.subscriptionPrice)}/mois. Un client trouvé, c&apos;est remboursé.</p>
        <ul className="mt-6 space-y-3">
          {perks.map((p) => (
            <li key={p} className="text-lg">
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-[2rem] border border-border bg-card p-6 glow-card sm:p-8">
        <h2 className="text-2xl font-semibold">👤 Entrer</h2>
        <p className="mt-1 mb-6 text-base text-muted-foreground">Pas de mot de passe.</p>
        {erreur && (
          <p role="alert" className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-800 dark:text-red-200">
            Ce lien a expiré. Recommence.
          </p>
        )}
        <LoginPanel suite={suite} />
      </div>
    </div>
  );
}
