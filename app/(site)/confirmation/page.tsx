import type { Metadata } from "next";
import { ConfirmationView } from "@/components/booking/confirmation-view";

export const metadata: Metadata = {
  title: "Réservation envoyée",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <ConfirmationView />
    </div>
  );
}
