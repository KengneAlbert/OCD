import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, XCircle } from "lucide-react";
import { Chyron } from "@/components/brand/broadcast";
import { PayButton } from "@/components/payments/pay-button";
import { AfterPayment } from "@/components/payments/after-payment";
import { HoldCountdown } from "@/components/payments/hold-countdown";
import { HOLD_MINUTES, holdExpiresAt } from "@/lib/db/holds";
import { getPayState, getReservationByToken } from "@/lib/db/payments";
import { isPaymentEnabled } from "@/lib/payments/swinmo";
import { formatDateFr, formatSlotFr } from "@/lib/schedule";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paiement de ton live",
  robots: { index: false, follow: false },
};

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ go?: string }>;
}) {
  const [{ token }, { go }] = await Promise.all([params, searchParams]);
  const r = await getReservationByToken(token);
  if (!r) notFound();
  const state = await getPayState(r);
  const enabled = isPaymentEnabled();
  const price = formatPrice(r.package_price);
  // Réservation pas encore payée : le créneau n'est bloqué que pendant HOLD_MINUTES.
  const holding = state === "payable" && r.status === "nouvelle";

  const rows: [string, string][] = [
    ["Référence", r.reference],
    ["Business", r.business_name],
    ["Date", formatDateFr(r.live_date)],
    ["Créneau", `${formatSlotFr(r.slot_start, r.slot_end)} (heure de Lomé)`],
    ["Type", r.live_type === "presentiel" ? "Au studio, à Lomé" : "À distance"],
    ["Package", r.package_name],
  ];

  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-ocd-cream to-transparent dark:from-white/[0.03]" />
      <div className="mx-auto max-w-xl px-4 pt-10 pb-20 sm:pt-14">
        <Chyron>Paiement · Mobile Money ou carte</Chyron>
        <h1 className="mt-4 text-[clamp(2.4rem,7vw,4rem)] leading-[0.95] font-semibold tracking-tight">
          {state === "paid" ? (
            <>
              C&apos;est <span className="accent font-normal text-ocd-orange-dark dark:text-ocd-orange">payé.</span>
            </>
          ) : (
            <>
              Bloque ton <span className="accent font-normal text-ocd-orange-dark dark:text-ocd-orange">créneau.</span>
            </>
          )}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {state === "paid"
            ? `Merci ${r.full_name.split(" ")[0]} ! Ton paiement est bien reçu, ton live est calé.`
            : state === "expired"
              ? `Désolé ${r.full_name.split(" ")[0]}, le délai de paiement est dépassé : le créneau a été libéré.`
              : `Bonjour ${r.full_name.split(" ")[0]}, ta réservation est validée dès que le paiement est reçu.`}
        </p>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-card glow-card">
          <dl className="divide-y divide-border px-6">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-3.5 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right font-semibold first-letter:uppercase">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-baseline justify-between bg-ocd-black px-6 py-5 text-white dark:bg-white/5">
            <span className="text-sm text-white/70">{state === "paid" ? "Total payé" : "Total à payer"}</span>
            <span className="text-3xl font-semibold tracking-tight text-ocd-orange">{price}</span>
          </div>
        </div>

        {holding && <HoldCountdown expiresAt={holdExpiresAt(r.created_at).toISOString()} totalMinutes={HOLD_MINUTES} />}

        <div className="mt-8">
          {state === "expired" ? (
            <div role="status" className="rounded-3xl bg-muted p-6 text-center">
              <Clock className="mx-auto size-12 text-muted-foreground" aria-hidden />
              <p className="mt-3 text-xl font-semibold">Délai de paiement dépassé</p>
              <p className="mt-1 text-muted-foreground">Aucun paiement n&apos;a été pris. Refais ta réservation pour choisir un créneau.</p>
              <Link
                href="/reserver"
                className="mt-5 inline-flex h-12 items-center rounded-full bg-ocd-orange px-6 font-semibold text-ocd-black transition hover:bg-ocd-black hover:text-white"
              >
                Refaire une réservation
              </Link>
            </div>
          ) : state === "paid" ? (
            <AfterPayment
              token={token}
              firstName={r.full_name.split(" ")[0] ?? r.full_name}
              liveType={r.live_type}
              slotStart={r.slot_start}
              reference={r.reference}
            />
          ) : state === "closed" ? (
            <div role="status" className="rounded-3xl bg-muted p-6 text-center">
              <XCircle className="mx-auto size-12 text-muted-foreground" aria-hidden />
              <p className="mt-3 text-xl font-semibold">Cette réservation n&apos;est plus payable</p>
              <p className="mt-1 text-muted-foreground">Elle a été annulée ou clôturée. Contacte l&apos;équipe si besoin.</p>
            </div>
          ) : enabled ? (
            <PayButton token={token} amountLabel={price} autoOpen={go === "1"} />
          ) : (
            <p className="rounded-3xl bg-ocd-cream p-6 text-center dark:bg-white/5">
              Le paiement en ligne arrive bientôt. L&apos;équipe t&apos;indique comment régler ton package.
            </p>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Une question ?{" "}
          <Link href="/contact" className="font-semibold text-accent-text underline underline-offset-4">
            Contacte l&apos;équipe
          </Link>
        </p>
      </div>
    </div>
  );
}
