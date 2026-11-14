import { NextResponse } from "next/server";
import { SUBSCRIPTION_REF_PREFIX } from "@/lib/db/lives";
import { CHARGE_ID_RE } from "@/lib/payments/rules";
import { verifyTransactionWithProvider } from "@/lib/payments/verify";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getServiceClient } from "@/lib/supabase/admin";
import { getAuthClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/abonnement/confirm { chargeId } — appelé après `onSuccess`.
 * La charge est RELUE chez Swinmo et doit appartenir à un paiement de l'utilisateur connecté.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`abonnement-confirm:${getClientIp(request.headers)}`, 20);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { chargeId?: unknown };
  if (typeof body.chargeId !== "string" || !CHARGE_ID_RE.test(body.chargeId)) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const supabase = await getAuthClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const db = getServiceClient();
  if (!data.user || !db) return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
  const userId = data.user.id;

  try {
    const outcome = await verifyTransactionWithProvider(body.chargeId, "retour client", {
      authorize: async (charge) => {
        if (!charge.reference.startsWith(SUBSCRIPTION_REF_PREFIX)) return false;
        const { data: mine } = await db.from("subscription_payments").select("id").eq("reference", charge.reference).eq("subscriber_id", userId).maybeSingle();
        return Boolean(mine);
      },
    });
    if (!outcome.ok) return NextResponse.json({ error: "Paiement non reconnu." }, { status: 400 });
    return NextResponse.json({ status: outcome.charge.status, result: outcome.result });
  } catch (error) {
    console.error("[abonnement.confirm]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Vérification impossible pour le moment." }, { status: 502 });
  }
}
