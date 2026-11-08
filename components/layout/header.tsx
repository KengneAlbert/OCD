"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, m, useScroll, useSpring } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <m.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-1 origin-left bg-gradient-to-r from-ocd-orange via-ocd-glow to-ocd-orange"
      />
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
        <div
          className={cn(
            "mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full border pr-1.5 pl-4 transition-all duration-500 sm:h-16 sm:pl-5",
            scrolled || open
              ? "border-border bg-background/80 shadow-[0_10px_40px_-20px_rgb(17_17_17/0.25)] backdrop-blur-xl"
              : "border-transparent bg-background/55 backdrop-blur-xl",
          )}
        >
          <Logo size="sm" priority />

          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-foreground/5",
                      isActive(item.href) ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                    {isActive(item.href) && <span aria-hidden className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-ocd-orange" />}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle className="hidden lg:inline-flex" />
            <Link
              href="/reserver"
              className="hidden h-11 items-center gap-2.5 rounded-full bg-ocd-black pr-5 pl-4 text-sm font-semibold text-white transition hover:bg-ocd-orange hover:text-ocd-black sm:inline-flex dark:bg-white dark:text-ocd-black"
            >
              <span aria-hidden className="size-2 animate-live rounded-full bg-ocd-live" />
              Réserver mon live
            </Link>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ocd-orange px-5 text-sm font-semibold text-ocd-black lg:hidden"
              aria-expanded={open}
              aria-controls="menu-plein-ecran"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Fermer" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <m.div
            id="menu-plein-ecran"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col bg-ocd-black px-5 pt-24 pb-8 text-white lg:hidden"
          >
            <nav aria-label="Navigation mobile" className="flex-1 overflow-y-auto">
              <ul>
                {[{ href: "/", label: "Accueil" }, ...siteConfig.nav].map((item, i) => (
                  <li key={item.href} className="overflow-hidden border-b border-white/10">
                    <m.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                      <Link
                        href={item.href}
                        aria-current={pathname === item.href ? "page" : undefined}
                        className="flex items-baseline justify-between py-3.5 text-[2.1rem] leading-none font-semibold tracking-tight"
                      >
                        <span className={pathname === item.href ? "accent text-ocd-orange" : ""}>{item.label}</span>
                        <span className="font-mono text-xs text-white/40">0{i + 1}</span>
                      </Link>
                    </m.div>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="space-y-4 pt-6">
              <Link
                href="/reserver"
                className="flex h-16 items-center justify-center gap-3 rounded-full bg-ocd-orange text-lg font-semibold text-ocd-black"
              >
                <span aria-hidden className="size-2 animate-live rounded-full bg-ocd-live" />
                Réserver mon live
              </Link>
              <div className="flex items-center justify-between font-mono text-xs tracking-widest text-white/50 uppercase">
                <span>Lomé · Afrique · Monde</span>
                <ThemeToggle withLabel className="text-white/70 hover:bg-white/10 hover:text-white" />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
