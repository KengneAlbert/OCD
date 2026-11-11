import { NextResponse } from "next/server";
import { getSubscriber, startSubscriptionPayment } from "@/lib/db/lives";
import { isPaymentEnabled, SwinmoError } from "@/lib/payments/swinmo";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getAuthClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** POST /api/abonnement/session → session Swinmo pour l'abonnement de l'utilisateur connecté. */
export async function POST(request: Request) {
  const limit = rateLimit(`abonnement:${getClientIp(request.headers)}`, 10);
  if (!limit.allowed) return NextResponse.json({ error: "Trop de tentatives. Réessaie dans quelques minutes." }, { status: 429 });
  if (!isPaymentEnabled()) return NextResponse.json({ error: "Le paiement en ligne n'est pas encore disponible." }, { status: 503 });

  const supabase = await getAuthClient();
  const { data } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!data.user) return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
  const sub = await getSubscriber(data.user.id);
  if (!sub) return NextResponse.json({ error: "Complète d'abord ton profil." }, { status: 400 });
  if (sub.status !== "actif") return NextResponse.json({ error: "Compte suspendu. Contacte l'équipe." }, { status: 403 });

  try {
    return NextResponse.json(await startSubscriptionPayment(sub));
  } catch (error) {
    console.error("[abonnement.session]", error);
    const message = error instanceof SwinmoError && error.code === "account_disabled" ? "Le paiement en ligne est momentanément indisponible." : "Impossible d'ouvrir le paiement. Réessaie.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
