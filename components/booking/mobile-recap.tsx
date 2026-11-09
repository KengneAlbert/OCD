"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Wifi } from "lucide-react";
import { getPackage } from "@/config/packages";
import { formatTimeFr, parseDateKey } from "@/lib/schedule";
import { formatPrice } from "@/lib/utils";
import { useBooking } from "./booking-provider";

/**
 * Résumé des choix en cours, affiché au-dessus des boutons dans la barre collée en bas (mobile uniquement) :
 * type de live, date + heure, package et prix toujours visibles pendant les 6 étapes.
 */
export function MobileRecap() {
  const { state } = useBooking();
  const pkg = getPackage(state.packageId);
  if (!state.liveType && !state.date && !pkg) return null;

  const when = state.date
    ? `${format(parseDateKey(state.date), "EEE d MMM", { locale: fr })}${state.slotStart ? ` · ${formatTimeFr(state.slotStart)}` : ""}`
    : null;
  const TypeIcon = state.liveType === "distance" ? Wifi : MapPin;

  return (
    <div className="mb-2.5 flex items-center gap-3 text-sm sm:hidden" aria-label="Ta réservation en cours">
      <div className="flex min-w-0 flex-1 items-center gap-2 text-muted-foreground">
        {state.liveType && <TypeIcon className="size-4 shrink-0 text-accent-text" aria-label={state.liveType === "distance" ? "À distance" : "Au studio"} />}
        {when ? (
          <span className="truncate first-letter:uppercase">
            {when}
          </span>
        ) : (
          <span className="truncate">{state.liveType === "distance" ? "Live à distance" : "Live au studio"}</span>
        )}
        {pkg && <span className="truncate">· {pkg.name}</span>}
      </div>
      {pkg && <span className="shrink-0 font-semibold tabular-nums text-foreground">{formatPrice(pkg.price)}</span>}
    </div>
  );
}
