import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock, LogOut, Radio, ShoppingBag, XCircle } from "lucide-react";
import { ProfileForm } from "@/components/espace/forms";
import { Flag } from "@/components/ui/flag";
import { ValidationStatus } from "@/components/lives/validation-status";
import { PayButton } from "@/components/payments/pay-button";
import { getCategory } from "@/config/live-categories";
import { getCountry } from "@/config/countries";
import { livesConfig } from "@/config/lives";
import { getSubscriber, listMyLives, type LiveStatus } from "@/lib/db/lives";
import { listMyProducts } from "@/lib/db/marketplace";
import { signOutSubscriberAction } from "@/lib/espace/actions";
import { hourLabel, isSubscriptionActive, PLATFORMS } from "@/lib/lives";
import { isPaymentEnabled } from "@/lib/payments/swinmo";
import { getAuthClient } from "@/lib/supabase/server";
import { cn, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const dateFr = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "UTC" });
const timeFr = (iso: string) => hourLabel(new Date(iso).toISOString().slice(11, 16));

const liveStatus: Record<LiveStatus, { label: string; icon: typeof Clock; className: string }> = {
  en_attente: { label: "Vérification", icon: Clock, className: "bg-ocd-orange/15 text-ocd-orange-dark dark:text-ocd-orange" },
  valide: { label: "En ligne", icon: Radio, className: "bg-red-500/12 text-red-700 dark:text-red-300" },
  refuse: { label: "Refusé", icon: XCircle, className: "bg-muted text-muted-foreground" },
  termine: { label: "Terminé", icon: CheckCircle2, className: "bg-muted text-muted-foreground" },
};

export default async function MoiPage() {
  const supabase = await getAuthClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const user = data.user;
  if (!user?.email) redirect("/connexion");

  const sub = await getSubscriber(user.id);
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const signOut = (
    <form action={signOutSubscriberAction}>
      <button type="submit" className="inline-flex min-h-12 items-center gap-2 text-base text-muted-foreground hover:text-foreground">
        <LogOut className="size-5" aria-hidden /> Sortir
      </button>
    </form>
  );

  // Première connexion : profil vendeur.
  if (!sub) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:pt-12">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">Étape 1/2</p>
          {signOut}
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">🏪 Ton business</h1>
        <div className="mt-6 rounded-[2rem] border border-border bg-card p-6 sm:p-8">
          <ProfileForm defaults={{ fullName: meta?.full_name ?? meta?.name }} submitLabel="Continuer" />
        </div>
      </div>
    );
  }

  const now = new Date();
  const active = isSubscriptionActive(sub.paid_until, now);
  const [lives, products] = await Promise.all([listMyLives(sub.id), listMyProducts(sub.id)]);
  const productCount = products.length;
  const price = formatPrice(livesConfig.subscriptionPrice);
  const daysLeft = sub.paid_until ? Math.ceil((new Date(sub.paid_until).getTime() - now.getTime()) / 86_400_000) : 0;
  const cat = getCategory(sub.category);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:pt-12">
      <div className="flex items-center justify-between gap-4">
        <ValidationStatus serverNow={now.toISOString()} />
        {signOut}
      </div>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight">Salut {sub.full_name.split(" ")[0]} 👋</h1>
      <p className="mt-1 text-lg text-muted-foreground">
        {sub.business_name} · <Flag code={sub.country} className="mx-0.5 -mt-0.5 h-3.5 align-middle" /> {sub.city ? `${sub.city}, ` : ""}
        {getCountry(sub.country)?.name} · {cat?.label}
      </p>

      {sub.status === "suspendu" && (
        <p role="alert" className="mt-6 rounded-2xl bg-red-500/10 px-4 py-3 text-lg font-medium text-red-800 dark:text-red-200">
          Compte suspendu. Contacte l&apos;équipe.
        </p>
      )}

      {active && sub.status === "actif" && (
        <Link
          href="/je-suis-en-live"
          className="mt-8 inline-flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-red-600 px-6 text-xl font-semibold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700"
        >
          🔴 Je suis en live
        </Link>
      )}

      {/* Abonnement */}
      <section className="mt-6 rounded-[2rem] border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">💳 Abonnement</h2>
        {active ? (
          <p className="mt-2 flex items-center gap-2 text-xl font-semibold">
            <CheckCircle2 className="size-6 text-emerald-600" aria-hidden /> Actif · {dateFr(sub.paid_until!)} ({daysLeft} j)
          </p>
        ) : (
          <>
            <p className="mt-2 text-xl font-semibold">{sub.paid_until ? "Expiré. Renouvelle pour revenir dans l'annuaire." : "Pas encore actif."}</p>
            <p className="mt-1 text-lg text-muted-foreground">
              {price} / {livesConfig.subscriptionDays} jours. = {Math.round(livesConfig.subscriptionPrice / livesConfig.subscriptionDays)} F par jour.
            </p>
          </>
        )}
        {sub.status === "actif" && (!active || daysLeft <= livesConfig.renewalReminderDays + 2) && (
          <div className="mt-5">
            {isPaymentEnabled() ? (
              <PayButton
                amountLabel={price}
                sessionUrl="/api/abonnement/session"
                confirmUrl="/api/abonnement/confirm"
                successTitle="Abonnement activé !"
                successText="Tu es prêt. Touche « Je suis en live » pendant ton live."
              />
            ) : (
              <p className="rounded-2xl bg-ocd-cream p-4 text-lg dark:bg-white/5">Paiement bientôt disponible.</p>
            )}
            {active && <p className="mt-2 text-center text-sm text-muted-foreground">+{livesConfig.subscriptionDays} jours après la fin actuelle.</p>}
          </div>
        )}
      </section>

      {/* Marketplace */}
      <Link
        href="/moi/produits"
        className="mt-6 flex items-center gap-4 rounded-[2rem] border border-border bg-card p-6 transition hover:border-foreground/30"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-semibold">Mes produits</span>
          <span className="block text-muted-foreground">
            {productCount ? `${productCount} sur la marketplace` : "Vends tes produits sur la marketplace"}
          </span>
        </span>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
      </Link>

      {/* Historique */}
      <section className="mt-6 rounded-[2rem] border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">📺 Mes lives</h2>
        {lives.length === 0 ? (
          <p className="mt-2 text-lg text-muted-foreground">Aucun live pour l&apos;instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {lives.map((l) => {
              const st = l.status === "valide" && new Date(l.ends_at) <= now ? liveStatus.termine : liveStatus[l.status];
              const Icon = st.icon;
              return (
                <li key={l.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">
                      {PLATFORMS[l.platform]?.label} · {getCategory(l.category)?.emoji} {getCategory(l.category)?.label}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {dateFr(l.created_at)} · {timeFr(l.created_at)} → {timeFr(l.ends_at)}
                      {l.reject_reason && ` · ${l.reject_reason}`}
                    </span>
                  </span>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", st.className)}>
                    <Icon className="size-4" aria-hidden /> {st.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <details className="mt-6 rounded-[2rem] border border-border bg-card p-6">
        <summary className="cursor-pointer text-lg font-semibold">✏️ Mon profil</summary>
        <div className="mt-5">
          <ProfileForm
            defaults={{
              fullName: sub.full_name,
              businessName: sub.business_name,
              country: sub.country,
              city: sub.city,
              category: sub.category,
              tiktok: sub.tiktok_handle,
              phone: sub.phone_e164?.replace(getCountry(sub.country)?.dialCode ?? "", "") ?? "",
            }}
          />
        </div>
      </details>
    </div>
  );
}
