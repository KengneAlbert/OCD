import { NextResponse } from "next/server";
import { getAuthClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Retour de Google / du lien magique : échange le code contre une session, puis redirige. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const suite = searchParams.get("suite");
  // Redirection interne uniquement (pas d'URL externe).
  const target = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : "/moi";

  if (code) {
    const supabase = await getAuthClient();
    const { error } = (await supabase?.auth.exchangeCodeForSession(code)) ?? { error: new Error("Supabase non configuré") };
    if (!error) return NextResponse.redirect(`${origin}${target}`);
    console.error("[auth.callback]", error.message);
  }
  return NextResponse.redirect(`${origin}/connexion?erreur=1`);
}
