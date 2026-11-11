import type { Metadata } from "next";
import { SubscriberButtons } from "@/components/admin/lives-forms";
import { EmptyState, PageTitle, Panel } from "@/components/admin/ui";
import { Flag } from "@/components/ui/flag";
import { getCategory } from "@/config/live-categories";
import { getCountry } from "@/config/countries";
import { livesConfig } from "@/config/lives";
import { listSubscribers } from "@/lib/db/lives";
import { isSubscriptionActive } from "@/lib/lives";
import { getServiceClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Abonnés" };
export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  const now = new Date();
  const subscribers = await listSubscribers();
  const db = getServiceClient();
  const { data: payments } = db
    ? await db.from("subscription_payments").select("amount").eq("status", "succeeded").gte("paid_at", `${now.toISOString().slice(0, 7)}-01T00:00:00Z`)
    : { data: [] };
  const monthRevenue = (payments ?? []).reduce((t: number, p: { amount: number }) => t + p.amount, 0);
  const active = subscribers.filter((s) => s.status === "actif" && isSubscriptionActive(s.paid_until, now));
  const expired = subscribers.filter((s) => s.paid_until && !isSubscriptionActive(s.paid_until, now));
  const waiting = subscribers.filter((s) => !s.paid_until);

  return (
    <>
      <PageTitle eyebrow={`${formatPrice(livesConfig.subscriptionPrice)} / ${livesConfig.subscriptionDays} jours`} title="Abonnés" />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Actifs", active.length],
          ["En attente de paiement", waiting.length],
          ["Expirés", expired.length],
          ["Encaissé ce mois", formatPrice(monthRevenue)],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-border bg-card p-5">
            <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <Panel title={`Tous les abonnés (${subscribers.length})`}>
        {subscribers.length === 0 ? (
          <EmptyState title="Aucun abonné pour l'instant">Les vendeurs s&apos;inscrivent depuis /connexion.</EmptyState>
        ) : (
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="text-left font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                  <th className="px-6 py-2 font-medium">Vendeur</th>
                  <th className="px-3 py-2 font-medium">Pays · catégorie</th>
                  <th className="px-3 py-2 font-medium">Statut</th>
                  <th className="px-6 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscribers.map((s) => {
                  const ok = isSubscriptionActive(s.paid_until, now);
                  const cat = getCategory(s.category);
                  return (
                    <tr key={s.id}>
                      <td className="px-6 py-3">
                        <p className="font-semibold">{s.business_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.full_name} · {s.email}
                          {s.phone_e164 && (
                            <>
                              {" · "}
                              <a href={`https://wa.me/${s.phone_e164.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {s.phone_e164}
                              </a>
                            </>
                          )}
                          {s.tiktok_handle && (
                            <>
                              {" · "}
                              <a href={`https://www.tiktok.com/@${s.tiktok_handle}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                @{s.tiktok_handle}
                              </a>
                            </>
                          )}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <Flag code={s.country} className="mr-1 -mt-0.5 h-3 align-middle" /> {getCountry(s.country)?.name ?? s.country}
                        {s.city && <span className="text-muted-foreground"> · {s.city}</span>}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {cat?.emoji} {cat?.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {s.status === "suspendu" ? (
                          <span className="font-semibold text-red-600">Suspendu</span>
                        ) : ok ? (
                          <span className="text-emerald-700 dark:text-emerald-300">
                            Actif · {new Date(s.paid_until!).toLocaleDateString("fr-FR", { timeZone: "UTC" })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">{s.paid_until ? "Expiré" : "En attente de paiement"}</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <SubscriberButtons id={s.id} suspended={s.status === "suspendu"} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
