import { NextResponse } from "next/server";
import { applySubscriptionCharge, SUBSCRIPTION_REF_PREFIX } from "@/lib/db/lives";
import { getCharge } from "@/lib/payments/swinmo";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/supabase/admin";
import { getAuthClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/abonnement/confirm { chargeId } — appelé après `onSuccess`.
 * La charge est relue chez Swinmo et doit appartenir à un paiement de l'utilisateur connecté.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`abonnement-confirm:${getClientIp(request.headers)}`, 20);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { chargeId?: unknown };
  if (typeof body.chargeId !== "string" || !/^ch_(test|live)_[\w-]{4,80}$/.test(body.chargeId)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const supabase = await getAuthClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const db = getServiceClient();
  if (!data.user || !db) return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });

  try {
    const charge = await getCharge(body.chargeId);
    if (!charge.reference.startsWith(SUBSCRIPTION_REF_PREFIX)) return NextResponse.json({ error: "Paiement non reconnu." }, { status: 400 });
    const { data: mine } = await db.from("subscription_payments").select("id").eq("reference", charge.reference).eq("subscriber_id", data.user.id).maybeSingle();
    if (!mine) return NextResponse.json({ error: "Paiement non reconnu." }, { status: 400 });
    const result = await applySubscriptionCharge(charge, "retour client");
    return NextResponse.json({ status: charge.status, result });
  } catch (error) {
    console.error("[abonnement.confirm]", error);
    return NextResponse.json({ error: "Vérification impossible pour le moment." }, { status: 502 });
  }
}
