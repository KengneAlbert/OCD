import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Radio } from "lucide-react";
import { EndLiveButton, LiveForm } from "@/components/espace/forms";
import { AutoRefresh } from "@/components/lives/auto-refresh";
import { ValidationStatus } from "@/components/lives/validation-status";
import { PayButton } from "@/components/payments/pay-button";
import { livesConfig } from "@/config/lives";
import { getOpenLive, getSubscriber } from "@/lib/db/lives";
import { countrySlug, currentWindow, hourLabel, isSubscriptionActive } from "@/lib/lives";
import { isPaymentEnabled } from "@/lib/payments/swinmo";
import { getAuthClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Je suis en live", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 pt-8 pb-24 sm:pt-12">
      <h1 className="flex items-center gap-3 text-4xl font-semibold tracking-tight">
        <span aria-hidden className="relative flex size-4">
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-60" />
          <span className="relative size-4 rounded-full bg-red-600" />
        </span>
        Je suis en live
      </h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default async function JeSuisEnLivePage() {
  const supabase = await getAuthClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user?.email) redirect("/connexion?suite=/je-suis-en-live");
  const sub = await getSubscriber(data.user.id);
  if (!sub) redirect("/moi");

  const now = new Date();
  const serverNow = now.toISOString();

  if (sub.status !== "actif") {
    return (
      <Shell>
        <p role="alert" className="rounded-2xl bg-red-500/10 p-5 text-lg font-medium text-red-800 dark:text-red-200">
          Compte suspendu. Contacte l&apos;équipe.
        </p>
      </Shell>
    );
  }

  if (!isSubscriptionActive(sub.paid_until, now)) {
    const price = formatPrice(livesConfig.subscriptionPrice);
    return (
      <Shell>
        <div className="rounded-[2rem] border-2 border-ocd-orange bg-ocd-orange/10 p-6">
          <p className="text-2xl font-semibold">{sub.paid_until ? "Renouvelle pour revenir dans l'annuaire." : "Active ton abonnement."}</p>
          <p className="mt-1 text-lg text-muted-foreground">
            {price} pour {livesConfig.subscriptionDays} jours.
          </p>
          <div className="mt-5">
            {isPaymentEnabled() ? (
              <PayButton
                amountLabel={price}
                sessionUrl="/api/abonnement/session"
                confirmUrl="/api/abonnement/confirm"
                successTitle="Abonnement activé !"
                successText="Tu peux envoyer ton live."
              />
            ) : (
              <p className="text-lg">Paiement bientôt disponible.</p>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  const open = await getOpenLive(sub.id, now);
  if (open) {
    const until = hourLabel(new Date(open.ends_at).toISOString().slice(11, 16));
    return (
      <Shell>
        <AutoRefresh seconds={30} />
        <div className="rounded-[2rem] border-2 border-border bg-card p-6 text-center">
          <p className="text-2xl font-semibold">{open.status === "valide" ? "🔴 Tu es dans l'annuaire" : "⏳ L'équipe vérifie ton live"}</p>
          <p className="mt-1 text-lg text-muted-foreground">Jusqu&apos;à {until}</p>
          <div className="mt-6 space-y-3">
            {open.status === "valide" && (
              <Link
                href={`/live/${countrySlug(open.country)}`}
                className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-ocd-black px-6 text-lg font-semibold text-white dark:bg-white dark:text-ocd-black"
              >
                <Radio className="size-5" aria-hidden /> Me voir
              </Link>
            )}
            <EndLiveButton id={open.id} />
          </div>
        </div>
      </Shell>
    );
  }

  if (!currentWindow(now)) {
    return (
      <Shell>
        <AutoRefresh seconds={60} />
        <ValidationStatus serverNow={serverNow} />
        <button
          type="button"
          disabled
          className="mt-6 inline-flex min-h-14 w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-muted px-6 text-lg font-semibold text-muted-foreground"
        >
          🔴 Envoyer mon live
        </button>
        <p className="mt-3 text-center text-lg text-muted-foreground">Reviens pendant le créneau.</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <ValidationStatus serverNow={serverNow} className="mb-6" />
      <LiveForm defaultCountry={sub.country} defaultCategory={sub.category} />
      <details className="mt-8 rounded-2xl bg-muted/60 p-4 text-base">
        <summary className="cursor-pointer font-semibold">❓ Aide</summary>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Lance ton live sur TikTok.</li>
          <li>Touche « Partager », puis « Copier le lien ».</li>
          <li>Reviens ici et touche « Coller ».</li>
        </ol>
      </details>
    </Shell>
  );
}
