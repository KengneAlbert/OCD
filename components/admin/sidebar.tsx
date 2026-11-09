"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, CalendarCheck, ExternalLink, LayoutDashboard, LogOut, Mail, Users } from "lucide-react";
import { signOutAction } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/reservations", label: "Réservations", icon: CalendarCheck },
  { href: "/admin/candidatures", label: "Candidatures", icon: Users },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/activite", label: "Journal", icon: Activity },
];

export function AdminSidebar({ email, badges }: { email: string; badges: { reservations: number; candidatures: number } }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const badgeFor = (href: string) =>
    href === "/admin/reservations" ? badges.reservations : href === "/admin/candidatures" ? badges.candidatures : 0;

  return (
    <aside className="sticky top-0 z-40 flex flex-col bg-ocd-black text-white lg:h-dvh lg:w-64 lg:shrink-0">
      <div className="flex items-center justify-between px-5 py-4 lg:px-6 lg:py-7">
        <Link href="/admin" className="text-2xl font-bold tracking-tight text-ocd-orange">
          OCD <span className="accent font-normal text-white">live</span>
          <span className="ml-2 align-middle font-mono text-[10px] font-medium tracking-[0.2em] text-white/40 uppercase">admin</span>
        </Link>
      </div>

      <nav aria-label="Navigation admin" className="no-scrollbar overflow-x-auto px-3 pb-3 lg:flex-1 lg:overflow-visible lg:pb-0">
        <ul className="flex gap-1 lg:flex-col">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            const badge = badgeFor(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition",
                    active ? "bg-white text-ocd-black" : "text-white/65 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="flex-1">{label}</span>
                  {badge > 0 && (
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", active ? "bg-ocd-orange text-ocd-black" : "bg-ocd-orange text-ocd-black")}>
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="hidden border-t border-white/10 p-4 lg:block">
        <Link href="/" target="_blank" className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white">
          <ExternalLink className="size-4" aria-hidden /> Voir le site
        </Link>
        <p className="truncate px-3 text-xs text-white/40">{email}</p>
        <form action={signOutAction}>
          <button type="submit" className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white">
            <LogOut className="size-4" aria-hidden /> Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
