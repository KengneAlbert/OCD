import { buildIcs } from "@/lib/agenda";
import { getPayState, getReservationByToken, payUrlFor } from "@/lib/db/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/agenda/:token → fichier .ics du live (uniquement une fois payé). */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getReservationByToken(token);
  if (!r || (await getPayState(r)) !== "paid") return new Response("Réservation introuvable.", { status: 404 });

  const ics = buildIcs({
    reference: r.reference,
    liveType: r.live_type,
    date: r.live_date,
    slotStart: r.slot_start,
    slotEnd: r.slot_end,
    packageName: r.package_name,
    businessName: r.business_name,
    url: payUrlFor(token),
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="live-ocd-${r.reference.toLowerCase()}.ics"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
