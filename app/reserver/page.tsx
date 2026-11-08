import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingProvider } from "@/components/booking/booking-provider";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { Chyron } from "@/components/brand/broadcast";

export const metadata: Metadata = {
  title: "Réserver mon live",
  description:
    "Réserve ton créneau de live OCD Live en 6 étapes : type de live (présentiel à Lomé ou à distance), date, heure, package et informations. Confirmation sur WhatsApp.",
  alternates: { canonical: "/reserver" },
};

export default function ReserverPage() {
  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-ocd-cream to-transparent dark:from-white/[0.03]" />
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
        <div className="mb-10">
          <Chyron>Réservation · environ 3 minutes</Chyron>
          <h1 className="mt-4 text-[clamp(2.4rem,7vw,4.5rem)] leading-[0.95] font-semibold">
            Réserve ton <span className="accent text-ocd-orange-dark dark:text-ocd-orange">live.</span>
          </h1>
        </div>
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-ocd-cream dark:bg-white/5" />}>
          <BookingProvider>
            <BookingWizard />
          </BookingProvider>
        </Suspense>
      </div>
    </div>
  );
}
