import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Protège /admin : rafraîchit la session Supabase et redirige vers la
 * page de connexion si personne n'est connecté. Le contrôle de la liste
 * ADMIN_EMAILS est refait côté serveur dans le layout de l'admin.
 */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLogin = request.nextUrl.pathname.startsWith("/admin/connexion");

  if (!url || !anonKey) {
    // Supabase non configuré : la page de connexion affiche un message d'aide.
    return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/connexion", request.url));
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

  if (!user && !isLogin) {
    const login = new URL("/admin/connexion", request.url);
    login.searchParams.set("suite", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  if (user && isLogin) return NextResponse.redirect(new URL("/admin", request.url));

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
