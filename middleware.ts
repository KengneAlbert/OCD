import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/supabase/env";

/**
 * Protège /admin (équipe), /moi et /je-suis-en-live (vendeurs) : rafraîchit la session Supabase et
 * redirige vers la page de connexion correspondante si personne n'est connecté.
 * Le contrôle de la liste ADMIN_EMAILS est refait côté serveur dans le layout de l'admin.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const area = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/connexion") || pathname.startsWith("/inscription") ? "login" : "vendeur";
  const loginPath = area === "admin" ? "/admin/connexion" : "/connexion";
  const home = area === "admin" ? "/admin" : "/moi";
  const isLogin = area === "login" || pathname.startsWith(loginPath);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Supabase non configuré : la page de connexion affiche un message d'aide.
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL(loginPath, request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Côté admin, un compte abonné connecté n'est pas un admin : traité comme non connecté.
  const allowed = area === "admin" ? Boolean(user && isAdminEmail(user.email)) : Boolean(user);

  if (!allowed && !isLogin) {
    const login = new URL(loginPath, request.url);
    login.searchParams.set("suite", pathname);
    return NextResponse.redirect(login);
  }
  if (allowed && isLogin) {
    const suite = request.nextUrl.searchParams.get("suite");
    const internal = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : home;
    return NextResponse.redirect(new URL(internal, request.url));
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: ["/admin/:path*", "/moi/:path*", "/je-suis-en-live/:path*", "/connexion", "/inscription"] };
