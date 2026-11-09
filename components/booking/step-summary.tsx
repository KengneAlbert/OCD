"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildReservation, firstInvalidStep } from "@/lib/booking";
import { sendReservation } from "@/lib/notifications";
import { generateReference } from "@/lib/reference";
import { STORAGE_KEYS, writeSession } from "@/lib/storage";
import { useBooking } from "./booking-provider";
import { ReservationRecap } from "./reservation-recap";
import { StepShell } from "./step-shell";

export interface LastReservation {
  reservation: NonNullable<ReturnType<typeof buildReservation>>;
  whatsappUrl?: string;
  whatsappBlocked?: boolean;
  emailed?: boolean;
  payUrl?: string;
}

export function StepSummary() {
  const router = useRouter();
  const { state, update, goTo, now, emailRequired, setError } = useBooking();
  const [sending, setSending] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    if (!state.reference) update({ reference: generateReference() });
  }, [state.reference, update]);

  const reservation = useMemo(
    () => (state.reference ? buildReservation(state, state.reference, now, emailRequired) : null),
    [state, now, emailRequired],
  );

  const handleSend = async () => {
    if (!reservation) {
      const step = firstInvalidStep(state, now, emailRequired);
      if (step !== null) goTo(step, true);
      setError("Il manque une information : vérifie cette étape.");
      return;
    }
    setSending(true);
    const result = await sendReservation(reservation, { honeypot });
    if (!result.ok) {
      setSending(false);
      setError(result.error ?? "L'envoi a échoué. Réessaie.");
      return;
    }
    const last: LastReservation = {
      reservation,
      whatsappUrl: result.whatsappUrl,
      whatsappBlocked: result.whatsappBlocked,
      emailed: result.emailed,
      payUrl: result.payUrl,
    };
    writeSession(STORAGE_KEYS.lastReservation, last);
    router.push("/confirmation");
  };

  if (!reservation) {
    return (
      <StepShell title="Récapitulatif">
        <p className="text-muted-foreground">Préparation de ton récapitulatif…</p>
      </StepShell>
    );
  }

  return (
    <StepShell title="Vérifie ta réservation" description="Tout est bon ? Tu peux modifier chaque section avant d'envoyer.">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-ocd-black p-5 text-white glow-strong dark:bg-card">
        <div>
          <p className="text-sm text-white/70">Ta référence</p>
          <p className="font-display text-2xl font-extrabold tracking-wider text-ocd-orange">{reservation.reference}</p>
        </div>
        <p className="max-w-xs text-sm text-white/80">Garde-la : elle sert à retrouver ta réservation.</p>
      </div>

      <ReservationRecap reservation={reservation} onEdit={(step) => goTo(step, true)} />

      {/* Honeypot anti-spam : invisible pour les humains. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Ne pas remplir</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      <div className="space-y-3 rounded-3xl border border-border bg-surface p-5 sm:p-6">
        <Button size="lg" className="w-full whitespace-normal" onClick={handleSend} disabled={sending}>
          {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
          {sending ? "Envoi en cours…" : "Envoyer ma réservation"}
        </Button>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-whatsapp" aria-hidden />
          {`Ta réservation est envoyée à l'équipe OCD Live et tu reçois une confirmation par email à ${reservation.info.email}. L'équipe te confirme ensuite le créneau et le paiement.`}
        </p>
      </div>
    </StepShell>
  );
}
