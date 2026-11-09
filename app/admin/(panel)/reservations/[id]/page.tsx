import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { CopyLinkButton, NotesForm, ReminderButton, StatusForm, VerifyPaymentsButton } from "@/components/admin/forms";
import { formatDateTime, KeyValue, Panel, StatusBadge, Timeline } from "@/components/admin/ui";
import { getCategoryLabel, getProductCountLabel } from "@/config/categories";
import { getCountry } from "@/config/countries";
import { reservationStatusMeta } from "@/lib/admin/status";
import { getEntityActivity, getEntityEmails } from "@/lib/db/admin-queries";
import { listPayments, payUrlFor } from "@/lib/db/payments";
import { getReservation } from "@/lib/db/reservations";
import { isPaymentEnabled, operatorLabel } from "@/lib/payments/swinmo";
import { formatDateFr, formatSlotFr } from "@/lib/schedule";
import { cn, formatPrice } from "@/lib/utils";
import { formatPhone } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Réservation" };

const UUID_RE = /^[0-9a-f-]{36}$/i;

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const r = await getReservation(id);
  if (!r) notFound();
  const [activity, emails, payments] = await Promise.all([getEntityActivity("reservation", id), getEntityEmails("reservation", id), listPayments(id)]);
  const paymentsOn = isPaymentEnabled();
  const paid = payments.find((p) => p.status === "succeeded");

  const phone = formatPhone(r.phone_country, r.phone_number);
  const waText = encodeURIComponent(`Bonjour ${r.full_name.split(" ")[0]}, ici l'équipe OCD Live à propos de ta réservation ${r.reference}.`);
  const country = r.country ? (getCountry(r.country)?.name ?? r.country) : null;

  return (
    <>
      <Link href="/admin/reservations" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Réservations
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-muted-foreground">{r.reference}</span>
            <StatusBadge status={r.status} />
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{r.business_name}</h1>
          <p className="mt-2 text-muted-foreground">
            <span className="capitalize">{formatDateFr(r.live_date)}</span> · {formatSlotFr(r.slot_start, r.slot_end)} ·{" "}
            {r.live_type === "presentiel" ? "Au studio" : "À distance"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/${r.phone_e164.replace(/\D/g, "")}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-whatsapp px-5 text-sm font-semibold text-ocd-black hover:brightness-95"
          >
            <MessageCircle className="size-4" aria-hidden /> WhatsApp
          </a>
          <a href={`tel:${r.phone_e164}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted">
            <Phone className="size-4" aria-hidden /> Appeler
          </a>
          {r.email && (
            <a href={`mailto:${r.email}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted">
              <Mail className="size-4" aria-hidden /> Email
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Le live">
            <KeyValue
              items={[
                ["Date", <span key="d" className="capitalize">{formatDateFr(r.live_date)}</span>],
                ["Créneau", `${formatSlotFr(r.slot_start, r.slot_end)} (heure de Lomé)`],
                ["Type", r.live_type === "presentiel" ? "Au studio, à Lomé" : `À distance${country || r.city ? ` · ${[r.city, country].filter(Boolean).join(", ")}` : ""}`],
                ["Package", `${r.package_name} · ${formatPrice(r.package_price)}`],
                ["Fuseau du client", r.visitor_timezone],
              ]}
            />
          </Panel>

          <Panel title="Le client et son business">
            <KeyValue
              items={[
                ["Nom", r.full_name],
                ["WhatsApp", phone],
                ["Email", r.email],
                ["Catégorie", getCategoryLabel(r.category, r.category_other ?? undefined)],
                ["Produits à présenter", r.product_description],
                ["Nombre de produits", getProductCountLabel(r.product_count ?? undefined)],
                ["Adresse boutique", r.shop_address],
                ["TikTok", r.tiktok],
                ["Facebook", r.facebook],
                ["Instagram", r.instagram],
                ["Besoins particuliers", r.special_needs],
              ]}
            />
          </Panel>

          <Panel title="Historique">
            <Timeline items={activity} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Statut">
            <p className="mb-4 text-sm text-muted-foreground">{reservationStatusMeta[r.status].hint}</p>
            <StatusForm kind="reservation" id={r.id} current={r.status} hasEmail={Boolean(r.email)} />
          </Panel>

          <Panel title="Paiement">
            {paid ? (
              <div className="rounded-2xl bg-emerald-500/10 p-4 text-sm">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">Payé · {formatPrice(paid.amount)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {operatorLabel(paid.operator)}
                  {paid.fee != null && ` · frais ${formatPrice(paid.fee)} · net ${formatPrice(paid.net ?? 0)}`}
                  {paid.paid_at && ` · ${formatDateTime(paid.paid_at)}`}
                  {paid.environment === "test" && " · sandbox"}
                </p>
              </div>
            ) : paymentsOn && r.pay_token && ["nouvelle", "confirmee"].includes(r.status) ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Le client peut payer {formatPrice(r.package_price)} en ligne avec ce lien (aussi présent dans ses emails).</p>
                <CopyLinkButton url={payUrlFor(r.pay_token)} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{paymentsOn ? "Paiement en ligne non disponible pour ce statut." : "Paiement en ligne non configuré (SWINMO_SECRET_KEY)."}</p>
            )}
            {payments.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className={cn("size-2 rounded-full", p.status === "succeeded" ? "bg-emerald-500" : p.status === "failed" ? "bg-red-500" : "bg-ocd-orange")} />
                      <span className="font-mono">{p.reference}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {{ open: "ouvert", processing: "en cours", succeeded: "payé", failed: `échoué${p.failure_reason ? ` (${p.failure_reason})` : ""}`, expired: "expiré" }[p.status]} · {formatDateTime(p.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {paymentsOn && payments.some((p) => p.status === "open" || p.status === "processing") && (
              <div className="mt-4">
                <VerifyPaymentsButton id={r.id} />
              </div>
            )}
          </Panel>

          <Panel title="Rappel">
            <ReminderButton id={r.id} disabled={!r.email || ["annulee", "realisee", "absente"].includes(r.status)} />
            {!r.email && <p className="mt-2 text-xs text-muted-foreground">Pas d&apos;email : rappelle le client sur WhatsApp.</p>}
          </Panel>

          <Panel title="Notes internes">
            <NotesForm entity="reservation" id={r.id} notes={r.admin_notes} />
          </Panel>

          <Panel title={`Emails (${emails.length})`}>
            {emails.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun email envoyé.</p>
            ) : (
              <ul className="space-y-3">
                {emails.map((e) => (
                  <li key={e.id} className="text-sm">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className={cn("size-2 rounded-full", e.status === "sent" ? "bg-emerald-500" : "bg-red-500")} />
                      <span className="font-medium">{e.subject}</span>
                    </span>
                    <span className="block pl-4 text-xs text-muted-foreground">
                      {e.to_email} · {formatDateTime(e.created_at)}
                      {e.error && <span className="block text-red-600">{e.error}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <p className="px-2 text-xs text-muted-foreground">
            Reçue le {formatDateTime(r.created_at)} · canal : {r.channel}
            <br />
            Dernière modification : {formatDateTime(r.updated_at)}
          </p>
        </div>
      </div>
    </>
  );
}
