import "server-only";
import { siteConfig } from "@/config/site";
import { reservationStatusMeta } from "@/lib/admin/status";
import { releaseExpiredHolds } from "@/lib/db/holds";
import { rowToReservationLike } from "@/lib/db/reservations";
import type { ReservationRow } from "@/lib/db/types";
import { teamDailyEmail } from "@/lib/emails/daily";
import { getBrevoEnv, sendEmail } from "@/lib/emails/send";
import { reservationReminderEmail, toReservationView } from "@/lib/emails/templates";
import { formatDateFr, formatSlotFr } from "@/lib/schedule";
import { getServiceClient } from "@/lib/supabase/admin";

export interface DailyJobResult {
  date: string;
  remindersSent: number;
  remindersSkipped: number;
  remindersFailed: number;
  todayLives: number;
  recapSent: boolean;
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10); // Lomé = GMT
const LIVE_STATUSES = ["payee", "confirmee"];

/**
 * Tâche du matin (6 h, heure de Lomé) :
 * 1. rappel J-1 aux clients qui passent en live demain (jamais deux fois) ;
 * 2. récapitulatif du jour envoyé à l'équipe.
 */
export async function runDailyJob(now = new Date()): Promise<DailyJobResult> {
  const db = getServiceClient();
  const brevo = getBrevoEnv();
  if (!db || !brevo) throw new Error("Supabase ou Brevo non configuré.");
  await releaseExpiredHolds();

  const today = dayKey(now);
  const tomorrow = dayKey(new Date(now.getTime() + 86_400_000));
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));

  // ─── 1. Rappels J-1 ───
  const { data: tomorrowRows } = await db
    .from("reservations")
    .select("*")
    .eq("live_date", tomorrow)
    .in("status", LIVE_STATUSES)
    .order("slot_start");
  const lives = (tomorrowRows ?? []) as ReservationRow[];

  const { data: alreadySent } = await db
    .from("email_log")
    .select("entity_id")
    .eq("template", "reservation-rappel")
    .eq("status", "sent")
    .in(
      "entity_id",
      lives.map((r) => r.id),
    );
  const done = new Set((alreadySent ?? []).map((e) => e.entity_id as string));

  let remindersSent = 0;
  let remindersSkipped = 0;
  let remindersFailed = 0;
  for (const r of lives) {
    if (!r.email || done.has(r.id)) {
      remindersSkipped += 1;
      continue;
    }
    const sent = await sendEmail(
      {
        template: "reservation-rappel",
        to: { email: r.email, name: r.full_name },
        content: reservationReminderEmail(toReservationView(rowToReservationLike(r))),
        entity: { type: "reservation", id: r.id },
        actor: "Rappel automatique",
      },
      brevo,
    );
    if (sent.ok) remindersSent += 1;
    else remindersFailed += 1;
  }

  // ─── 2. Récap équipe ───
  const [todayRes, paidYesterday, anomalies] = await Promise.all([
    db.from("reservations").select("*").eq("live_date", today).in("status", [...LIVE_STATUSES, "realisee"]).order("slot_start"),
    db.from("payments").select("amount").eq("status", "succeeded").gte("paid_at", `${yesterday}T00:00:00Z`).lt("paid_at", `${today}T00:00:00Z`),
    db
      .from("activity_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "payment_anomaly")
      .gte("created_at", new Date(now.getTime() - 7 * 86_400_000).toISOString()),
  ]);
  const todayRows = (todayRes.data ?? []) as ReservationRow[];
  const payments = (paidYesterday.data ?? []) as { amount: number }[];

  const recap = await sendEmail(
    {
      template: "equipe-recap",
      to: { email: brevo.teamEmail, name: "Équipe OCD Live" },
      content: teamDailyEmail({
        dateLabel: formatDateFr(today),
        today: todayRows.map((r) => ({
          slot: formatSlotFr(r.slot_start, r.slot_end),
          businessName: r.business_name,
          fullName: r.full_name,
          phone: r.phone_e164,
          liveType: r.live_type,
          packageName: r.package_name,
          status: reservationStatusMeta[r.status]?.label ?? r.status,
          adminUrl: `${siteConfig.url}/admin/reservations/${r.id}`,
        })),
        tomorrowCount: lives.length,
        yesterday: { paid: payments.length, revenue: payments.reduce((t, p) => t + p.amount, 0) },
        remindersSent,
        remindersFailed,
        anomalies: anomalies.count ?? 0,
      }),
      actor: "Tâche du matin",
    },
    brevo,
  );

  return { date: today, remindersSent, remindersSkipped, remindersFailed, todayLives: todayRows.length, recapSent: recap.ok };
}
