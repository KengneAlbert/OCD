"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Smartphone } from "lucide-react";
import { getPackage } from "@/config/packages";
import { formatPrice } from "@/lib/utils";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS, readSession, removeSession } from "@/lib/storage";
import { ReservationRecap } from "./reservation-recap";
import type { LastReservation } from "./step-summary";

export function ConfirmationView() {
  const [data, setData] = useState<LastReservation | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setData(readSession<LastReservation>(STORAGE_KEYS.lastReservation));
    // La réservation est envoyée : on vide le tunnel pour une prochaine réservation.
    removeSession(STORAGE_KEYS.booking);
  }, []);

  if (data === undefined) return <div className="h-96 animate-pulse rounded-3xl bg-ocd-cream dark:bg-white/5" />;

  if (!data) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-extrabold">Aucune réservation en cours</h1>
        <p className="text-muted-foreground">Tu n&apos;as pas encore envoyé de réservation depuis cet appareil.</p>
        <Button asChild size="lg">
          <Link href="/reserver">Réserver mon live</Link>
        </Button>
      </div>
    );
  }

  const { reservation, emailed, payUrl } = data;
  const payPath = payUrl ? new URL(payUrl).pathname : null;
  const price = getPackage(reservation.packageId)?.price;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reservation.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-8">
      <m.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 text-center glow-strong sm:p-10"
      >
        <div aria-hidden className="absolute -top-20 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-ocd-glow/60 blur-3xl dark:bg-ocd-orange/20" />
        <div className="relative space-y-4">
          <CheckCircle2 className="mx-auto size-16 text-whatsapp" aria-hidden />
          <h1 className="text-3xl font-extrabold sm:text-4xl">Ta demande est envoyée !</h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            {emailed
              ? `Un email de confirmation vient de t'être envoyé à ${reservation.info.email}.`
              : "L'équipe OCD Live a bien reçu ta demande."}{" "}
            On te confirme le créneau très vite.
          </p>
          <div className="mx-auto inline-flex items-center gap-3 rounded-2xl bg-ocd-black px-5 py-3 text-white dark:bg-white/10">
            <span className="text-sm text-white/70">Référence</span>
            <span className="font-display text-2xl font-extrabold tracking-wider text-ocd-orange">{reservation.reference}</span>
            <button type="button" onClick={copy} className="rounded-lg p-1.5 hover:bg-white/10" aria-label="Copier la référence">
              <Copy className="size-4" aria-hidden />
            </button>
          </div>
          <p aria-live="polite" className="h-5 text-sm text-whatsapp">
            {copied ? "Référence copiée !" : ""}
          </p>
        </div>
      </m.div>

      {payPath && (
        <div className="flex flex-col gap-5 rounded-[2rem] bg-ocd-black p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8 dark:bg-card">
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-white/50 uppercase">Étape suivante</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
              Bloque ton créneau <span className="accent font-normal text-ocd-orange">maintenant.</span>
            </p>
            <p className="mt-1 text-sm text-white/65">Paiement Mobile Money en 1 minute : T-Money, Moov Money, Orange, MTN, Wave…</p>
          </div>
          <Link
            href={payPath}
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-ocd-orange px-7 font-semibold text-ocd-black transition hover:bg-white"
          >
            <Smartphone className="size-5" aria-hidden />
            {price ? `Payer ${formatPrice(price)}` : "Payer maintenant"}
          </Link>
        </div>
      )}

      <section aria-labelledby="next-steps" className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 id="next-steps" className="mb-4 text-xl font-bold">
          Et maintenant ?
        </h2>
        <ol className="space-y-3">
          {[
            "L'équipe vérifie la disponibilité de ton créneau.",
            "Elle te confirme le créneau et les modalités de paiement par email et par téléphone.",
            "Ton créneau est bloqué après paiement. Prépare ton live !",
          ].map((text, i) => (
            <li key={text} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ocd-orange text-sm font-bold text-ocd-black">
                {i + 1}
              </span>
              <span className="pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
        <Link href="/comment-ca-marche#preparer" className="mt-4 inline-block text-sm font-semibold text-accent-text underline underline-offset-4">
          Voir la checklist pour préparer ton live
        </Link>
      </section>

      <div>
        <h2 className="mb-4 text-xl font-bold">Récapitulatif</h2>
        <ReservationRecap reservation={reservation} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
        <Button asChild variant="dark" className="flex-1">
          <Link href="/reserver">Réserver un autre live</Link>
        </Button>
      </div>
    </div>
  );
}
