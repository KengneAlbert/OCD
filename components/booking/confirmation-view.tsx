"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy, MessageCircleMore } from "lucide-react";
import { m } from "framer-motion";
import { WhatsAppIcon } from "@/components/shared/icons";
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

  const { reservation, whatsappUrl, whatsappBlocked, emailed } = data;

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
            L&apos;équipe OCD Live te confirme le créneau sur WhatsApp.
            {emailed && " Un email de confirmation t'a aussi été envoyé."}
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

      {whatsappUrl && (
        <div className="rounded-3xl border border-whatsapp/30 bg-green-50 p-5 sm:p-6 dark:bg-green-950/30">
          <p className="mb-4 flex items-start gap-2 text-sm">
            <MessageCircleMore className="mt-0.5 size-5 shrink-0 text-whatsapp" aria-hidden />
            <span>
              {whatsappBlocked ? (
                <strong>WhatsApp ne s&apos;est pas ouvert automatiquement. Appuie sur le bouton ci-dessous pour envoyer ton message.</strong>
              ) : (
                <>
                  N&apos;oublie pas d&apos;appuyer sur <strong>« Envoyer »</strong> dans WhatsApp. Si la fenêtre ne s&apos;est pas ouverte, utilise
                  le bouton ci-dessous.
                </>
              )}
            </span>
          </p>
          <Button asChild variant="whatsapp" size="lg" className="w-full whitespace-normal">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              Ouvrir WhatsApp avec mon message
            </a>
          </Button>
        </div>
      )}

      <section aria-labelledby="next-steps" className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <h2 id="next-steps" className="mb-4 text-xl font-bold">
          Et maintenant ?
        </h2>
        <ol className="space-y-3">
          {[
            "L'équipe vérifie la disponibilité de ton créneau.",
            "Elle te confirme le créneau et les modalités de paiement sur WhatsApp.",
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
