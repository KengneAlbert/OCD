import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { getCategoryLabel, getProductCountLabel } from "@/config/categories";
import { getPackage } from "@/config/packages";
import { formatDateFr, formatSlotFr } from "@/lib/schedule";
import { formatPrice } from "@/lib/utils";
import { formatLiveType, formatPhone, formatSocials } from "@/lib/whatsapp";
import type { Reservation } from "@/types";

function RecapSection({ title, onEdit, children }: { title: string; onEdit?: () => void; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-accent-text hover:bg-ocd-cream dark:hover:bg-white/5"
            aria-label={`Modifier : ${title}`}
          >
            <Pencil className="size-4" aria-hidden />
            Modifier
          </button>
        )}
      </div>
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[minmax(8rem,auto)_1fr]">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words">{value || "—"}</dd>
    </>
  );
}

/** Récapitulatif d'une réservation (étape 6 et page de confirmation). */
export function ReservationRecap({ reservation, onEdit }: { reservation: Reservation; onEdit?: (step: number) => void }) {
  const { info } = reservation;
  const pkg = getPackage(reservation.packageId);
  const edit = (step: number) => (onEdit ? () => onEdit(step) : undefined);

  return (
    <div className="space-y-4">
      <RecapSection title="Type de live" onEdit={edit(0)}>
        <Row label="Formule" value={formatLiveType(reservation)} />
      </RecapSection>

      <RecapSection title="Date et créneau" onEdit={edit(1)}>
        <Row label="Date" value={<span className="capitalize">{formatDateFr(reservation.date)}</span>} />
        <Row label="Créneau" value={`${formatSlotFr(reservation.slotStart, reservation.slotEnd)} (heure de Lomé)`} />
      </RecapSection>

      <RecapSection title="Package" onEdit={edit(3)}>
        <Row label="Package" value={pkg?.name} />
        <Row label="Prix" value={pkg ? formatPrice(pkg.price) : undefined} />
      </RecapSection>

      <RecapSection title="Tes informations" onEdit={edit(4)}>
        <Row label="Nom" value={info.fullName} />
        <Row label="Business" value={info.businessName} />
        <Row label="Catégorie" value={getCategoryLabel(info.category, info.categoryOther)} />
        <Row label="Produit(s)" value={info.productDescription} />
        <Row label="Nombre de produits" value={getProductCountLabel(info.productCount)} />
        <Row label="WhatsApp" value={formatPhone(info.phoneCountry, info.phoneNumber)} />
        <Row label="Email" value={info.email} />
        <Row label="Adresse boutique" value={info.shopAddress} />
        <Row label="Réseaux sociaux" value={formatSocials(info) === "—" ? undefined : formatSocials(info)} />
        <Row label="Message" value={info.specialNeeds} />
      </RecapSection>
    </div>
  );
}
