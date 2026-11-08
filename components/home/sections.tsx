import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, CheckCircle2, MousePointerClick, Package, Send } from "lucide-react";
import { AfricaGlow } from "@/components/brand/africa-glow";
import { AfricaNetwork } from "@/components/brand/africa-network";
import { Chyron, Marquee, Rec, SpinBadge, Viewfinder } from "@/components/brand/broadcast";
import { Logo } from "@/components/brand/logo";
import { Section } from "@/components/layout/page-header";
import { FaqList } from "@/components/shared/faq-list";
import { PillLink } from "@/components/ui/pill-link";
import { categories, categoryPhotoCredits } from "@/config/categories";
import { faq, prepareChecklist } from "@/config/content";
import { packages } from "@/config/packages";
import { cn, formatPrice } from "@/lib/utils";

/* ─── Bandeaux croisés ─────────────────────────────────────────────────── */

export function BigMarquee() {
  const cities = ["En direct", "Lomé", "Abidjan", "Dakar", "Douala", "Cotonou", "Kinshasa", "Paris", "Bruxelles"];
  const shouts = ["Réserve ton live", "1er décembre", "Studio à Lomé", "Partout en Afrique", "Vends plus", "Passe en direct"];
  return (
    <div className="relative py-10 sm:py-16" aria-hidden>
      <div className="relative z-10 -mx-4 -rotate-2 bg-ocd-orange py-4 text-ocd-black shadow-[0_20px_40px_-20px_rgb(232_121_43/0.7)] sm:py-6">
        <Marquee className="text-[clamp(2.2rem,6.5vw,5rem)] leading-none font-semibold tracking-[-0.04em]">
          {cities.map((w, i) => (
            <span key={w} className="flex items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
              <span className={i % 2 ? "accent font-normal" : ""}>{w}</span>
              <span className="size-3 rounded-full bg-ocd-black sm:size-4" />
            </span>
          ))}
        </Marquee>
      </div>
      <div className="absolute inset-x-0 top-1/2 z-20 -mx-4 -translate-y-1/2 rotate-[2.5deg] bg-ocd-black py-3 text-white dark:bg-white dark:text-ocd-black">
        <Marquee reverse speed="fast" className="font-mono text-sm tracking-[0.25em] uppercase">
          {shouts.map((w) => (
            <span key={w} className="flex items-center gap-6 pr-6">
              {w}
              <span className="text-ocd-orange">✦</span>
            </span>
          ))}
        </Marquee>
      </div>
    </div>
  );
}

/* ─── Deux plateaux ────────────────────────────────────────────────────── */

const plateaux = [
  {
    key: "A",
    tag: "Au studio",
    title: "Live en présentiel",
    place: "Studio OCD Live · Lomé, Togo",
    points: ["Tu viens avec tes produits", "Une régie pro dirige ton live", "Le décor lumineux de la carte d'Afrique", "Arrivée 30 min avant"],
    href: "/reserver?type=presentiel",
    cta: "Réserver au studio",
    dark: false,
  },
  {
    key: "B",
    tag: "Partout",
    title: "Live à distance",
    place: "Depuis chez toi, dans n'importe quel pays",
    points: ["Tu fais ton live avec ton téléphone", "Une animatrice t'accompagne depuis le studio", "Elle anime et rappelle ton numéro", "Test de connexion avant le jour J"],
    href: "/reserver?type=distance",
    cta: "Réserver à distance",
    dark: true,
  },
];

export function LiveFormats() {
  return (
    <Section eyebrow="02 — Deux plateaux" title={<>Au studio ou <span className="accent">à distance.</span></>} description="Même visibilité, même accompagnement. Seul le lieu change.">
      <div className="flex flex-col gap-4 lg:h-[40rem] lg:flex-row">
        {plateaux.map((p) => (
          <article
            key={p.key}
            className={cn(
              "group relative flex min-h-[34rem] flex-col overflow-hidden rounded-[2rem] p-7 transition-[flex-grow] duration-700 ease-[var(--ease-out-expo)] sm:p-10 lg:min-h-0 lg:flex-1 lg:hover:flex-[1.45]",
              p.dark ? "bg-ocd-black text-white" : "border border-border bg-card",
            )}
          >
            <Viewfinder tone={p.dark ? "light" : "dark"} />
            <div className="relative z-10 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] uppercase opacity-70">
              <span>Plateau {p.key}</span>
              <span>{p.tag}</span>
            </div>

            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-14 flex justify-center transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-105">
              {p.dark ? (
                <AfricaNetwork tone="dark" labels={false} className="w-[19rem] opacity-90 sm:w-[22rem]" />
              ) : (
                <div className="relative w-[17rem] sm:w-[20rem]">
                  <div className="absolute inset-0 animate-breathe rounded-full bg-ocd-glow/70 blur-3xl" />
                  <AfricaGlow showLome={false} animated={false} className="relative" />
                  <div className="absolute inset-0 flex items-center justify-center pb-6">
                    <Logo href={null} size="md" />
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 mt-auto">
              <h3 className="text-4xl font-semibold sm:text-5xl">{p.title}</h3>
              <p className={cn("mt-2 font-medium", p.dark ? "text-ocd-orange" : "text-accent-text")}>{p.place}</p>
              <ul className={cn("mt-5 grid gap-2 text-sm sm:grid-cols-2", p.dark ? "text-white/75" : "text-muted-foreground")}>
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-ocd-orange" aria-hidden />
                    {pt}
                  </li>
                ))}
              </ul>
              <PillLink href={p.href} variant={p.dark ? "orange" : "dark"} size="md" className="mt-7">
                {p.cta}
              </PillLink>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ─── Comment ça marche : cartes empilées au défilement ────────────────── */

export const howSteps = [
  { icon: MousePointerClick, title: "Choisis ton type", text: "Live au studio à Lomé, ou à distance depuis chez toi ou ta boutique." },
  { icon: CalendarDays, title: "Choisis ta date et ton heure", text: "Des créneaux de 1h30, du lundi au samedi, à partir du 1er décembre." },
  { icon: Package, title: "Choisis ton package", text: "Un live découverte, un pack de 4 lives, une formule tout le mois…" },
  { icon: Send, title: "Envoie ta réservation", text: "Elle arrive directement sur notre WhatsApp. On te confirme ton créneau." },
];

const stepStyles = [
  "bg-card border border-border",
  "bg-ocd-cream border border-border dark:bg-surface",
  "bg-ocd-orange text-ocd-black",
  "bg-ocd-black text-white dark:bg-[#202020]",
];

export function HowItWorks() {
  return (
    <Section eyebrow="03 — Simple et rapide" title={<>Ton live en <span className="accent">4 étapes.</span></>} description="Réserve en 3 minutes, depuis ton téléphone.">
      <ol className="relative">
        {howSteps.map((s, i) => (
          <li
            key={s.title}
            className={cn("sticky mb-6 last:mb-0", i < howSteps.length - 1 && "pb-[8vh]")}
            style={{ top: `calc(6rem + ${i * 1.4}rem)` }}
          >
            <div className={cn("relative flex min-h-[19rem] flex-col justify-between overflow-hidden rounded-[2rem] p-7 shadow-[0_-20px_50px_-30px_rgb(17_17_17/0.35)] sm:min-h-[22rem] sm:p-10", stepStyles[i])}>
              <div className="flex items-start justify-between gap-6">
                <s.icon className="size-8 opacity-80" aria-hidden />
                <span aria-hidden className="accent -mt-4 text-[7rem] leading-none opacity-90 sm:text-[11rem]">
                  0{i + 1}
                </span>
              </div>
              <div className="max-w-xl">
                <h3 className="text-3xl font-semibold sm:text-5xl">
                  <span className="sr-only">Étape {i + 1} : </span>
                  {s.title}
                </h3>
                <p className="mt-3 text-lg opacity-75">{s.text}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-12">
        <PillLink href="/reserver">Réserver mon live</PillLink>
      </div>
    </Section>
  );
}

/* ─── Packages : la grille des programmes ──────────────────────────────── */

export function PackagesPreview() {
  const highlighted = packages.filter((p) => p.highlighted).slice(0, 3);
  return (
    <Section eyebrow="04 — La grille" title={<>Un prix pour chaque <span className="accent">ambition.</span></>} description="Prix en FCFA, réglés après confirmation de ton créneau.">
      <ul className="border-t border-foreground">
        {highlighted.map((pkg, i) => (
          <li key={pkg.id}>
            <Link
              href={`/reserver${pkg.compatibleWith.length === 1 ? `?type=${pkg.compatibleWith[0]}` : ""}`}
              className="group relative grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-2 overflow-hidden border-b border-foreground py-7 sm:grid-cols-12 sm:py-9"
            >
              <span aria-hidden className="absolute inset-0 translate-y-full bg-ocd-orange transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-0" />
              <span className="relative font-mono text-xs text-muted-foreground transition-colors group-hover:text-ocd-black sm:col-span-1">0{i + 1}</span>
              <span className="relative col-span-2 row-start-2 sm:col-span-5 sm:row-start-auto">
                <span className="block text-3xl font-semibold tracking-tight transition-colors group-hover:text-ocd-black sm:text-5xl">
                  {pkg.name}
                  {pkg.popular && (
                    <span className="accent ml-3 align-middle text-base text-accent-text transition-colors group-hover:text-ocd-black sm:text-xl">
                      ★ populaire
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-muted-foreground transition-colors group-hover:text-ocd-black/80">{pkg.tagline}</span>
              </span>
              <span className="relative hidden font-mono text-xs tracking-wider text-muted-foreground uppercase transition-colors group-hover:text-ocd-black sm:col-span-3 sm:block">
                {pkg.livesLabel} · {pkg.compatibleWith.length === 2 ? "Studio ou distance" : pkg.compatibleWith[0] === "presentiel" ? "Au studio" : "À distance"}
              </span>
              <span className="relative col-start-2 row-start-1 flex items-center justify-end gap-4 sm:col-span-3 sm:col-start-auto sm:row-start-auto">
                <span className="text-right">
                  <span className="block text-2xl font-semibold whitespace-nowrap transition-colors group-hover:text-ocd-black sm:text-3xl">{formatPrice(pkg.price)}</span>
                  {pkg.originalPrice && (
                    <s className="block text-sm text-muted-foreground transition-colors group-hover:text-ocd-black/70">{formatPrice(pkg.originalPrice)}</s>
                  )}
                </span>
                <span className="hidden size-12 shrink-0 items-center justify-center rounded-full border border-foreground/20 transition-all duration-500 group-hover:rotate-45 group-hover:border-ocd-black group-hover:bg-ocd-black group-hover:text-white sm:flex">
                  <ArrowUpRight className="size-5" aria-hidden />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <PillLink href="/packages" variant="outline" size="md">
          Voir les {packages.length} packages et le comparatif
        </PillLink>
      </div>
    </Section>
  );
}

/* ─── Pour qui : tuiles d'activités ────────────────────────────────────── */

const productWords = ["Pagne", "Karité", "Perruques", "Jus de bissap", "Bijoux", "Téléphones", "Épices", "Sneakers", "Gâteaux", "Huile rouge", "Coaching", "Sacs", "Parfums", "Gari", "Sculptures", "Montres"];

/** Couleur de la tuile + voile posé sur la photo floutée pour garder le texte lisible. */
const tileTones = [
  { tile: "bg-white text-ocd-black", veil: "bg-white/60 group-hover:bg-white/45" },
  { tile: "bg-ocd-black text-white", veil: "bg-ocd-black/55 group-hover:bg-ocd-black/40" },
  { tile: "bg-ocd-cream text-ocd-black", veil: "bg-ocd-cream/60 group-hover:bg-ocd-cream/45" },
];

export function ForWho() {
  return (
    <section aria-labelledby="pour-qui-title" className="relative overflow-hidden bg-ocd-orange text-ocd-black">
      <div className="border-b border-ocd-black/15 py-4" aria-hidden>
        <Marquee className="text-xl font-semibold tracking-tight sm:text-2xl">
          {productWords.map((w, i) => (
            <span key={w} className="flex items-center gap-5 pr-5">
              <span className={i % 3 === 1 ? "accent text-2xl font-normal sm:text-3xl" : ""}>{w}</span>
              <span className="size-2 rounded-full bg-ocd-black" />
            </span>
          ))}
        </Marquee>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-3xl">
            <Chyron index="05" className="text-ocd-black/70 [&_span:first-child]:bg-ocd-black">
              Pour qui ?
            </Chyron>
            <h2 id="pour-qui-title" className="mt-5 text-[clamp(2.6rem,7.5vw,5.6rem)] leading-[0.92] font-semibold tracking-[-0.045em]">
              Tous ceux qui ont <br className="hidden sm:block" />
              quelque chose <span className="accent font-normal whitespace-nowrap">à vendre.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg text-ocd-black/75">
              Un produit, un service, une passion : si ça se vend, ça se montre en live. Trouve ton rayon.
            </p>
          </div>
          <SpinBadge text="Ton produit · ton live · ta vitrine · " className="hidden text-ocd-black md:inline-flex">
            <span className="flex size-12 animate-wiggle items-center justify-center rounded-full bg-ocd-black text-xl text-ocd-orange">★</span>
          </SpinBadge>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {categories.map((c, i) => (
            <li key={c.id} className={cn(i === 0 && "col-span-2 lg:row-span-2")}>
              <div
                className={cn(
                  "group relative flex h-full min-h-40 flex-col justify-between gap-6 overflow-hidden rounded-[1.75rem] p-5 transition-transform duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:-rotate-1 sm:p-6",
                  tileTones[i % tileTones.length]?.tile,
                  i === 0 && "lg:min-h-[22rem]",
                )}
              >
                {c.image && (
                  <span aria-hidden className="pointer-events-none absolute inset-0">
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes={i === 0 ? "(min-width: 1024px) 26rem, 100vw" : "(min-width: 1024px) 13rem, 50vw"}
                      className="scale-125 object-cover blur-[5px] transition-[filter,transform] duration-700 ease-[var(--ease-out-expo)] group-hover:scale-110 group-hover:blur-[2px]"
                    />
                    <span className={cn("absolute inset-0 transition-colors duration-700", tileTones[i % tileTones.length]?.veil)} />
                  </span>
                )}
                <span className="relative flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-full bg-ocd-orange text-ocd-black transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12">
                    <c.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] opacity-50">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="relative">
                  <span className={cn("block leading-none font-semibold tracking-tight", i === 0 ? "text-4xl sm:text-6xl" : "text-2xl sm:text-3xl")}>
                    {c.short}
                  </span>
                  <span className={cn("mt-2 block text-sm opacity-65", i === 0 ? "max-w-xs sm:text-base" : "line-clamp-2")}>{c.examples}</span>
                </span>
              </div>
            </li>
          ))}
          <li className="col-span-2 lg:col-span-3">
            <Link
              href="/reserver"
              className="group flex h-full min-h-40 flex-col justify-between gap-6 rounded-[1.75rem] border-2 border-dashed border-ocd-black/50 p-5 transition-colors hover:border-ocd-black hover:bg-ocd-black hover:text-white sm:p-6 lg:flex-row lg:items-end"
            >
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-current text-xl transition-transform duration-500 group-hover:rotate-90">+</span>
              <span>
                <span className="block text-2xl leading-none font-semibold tracking-tight sm:text-3xl lg:text-5xl">
                  Et <span className="accent font-normal">toi ?</span>
                </span>
                <span className="mt-2 flex items-center gap-1 text-sm opacity-75">
                  Ton activité a sa place aussi <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </span>
            </Link>
          </li>
        </ul>
        <p className="mt-8 text-xs leading-relaxed text-ocd-black/60">
          Photos de fond : Wikimedia Commons ·{" "}
          {categoryPhotoCredits.map((c, i) => (
            <span key={c.url}>
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                {c.author}
              </a>{" "}
              ({c.license}){i < categoryPhotoCredits.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

/* ─── Préparer son live ────────────────────────────────────────────────── */

export function PrepareChecklist({ id }: { id?: string }) {
  return (
    <Section id={id} eyebrow="Checklist" title={<>Préparer son <span className="accent">live.</span></>} description="Les 6 réflexes des vendeurs qui cartonnent en direct.">
      <ul className="grid border-t border-foreground/15 sm:grid-cols-2 lg:grid-cols-3">
        {prepareChecklist.map((item, i) => (
          <li key={item.title} className="flex gap-4 border-b border-foreground/15 py-6 sm:pr-8">
            <span className="font-mono text-xs text-accent-text">0{i + 1}</span>
            <span>
              <span className="flex items-center gap-2 text-xl font-semibold">
                {item.title}
                <CheckCircle2 className="size-4 text-whatsapp" aria-hidden />
              </span>
              <span className="text-muted-foreground">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ─── FAQ ──────────────────────────────────────────────────────────────── */

export function FaqPreview() {
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <Chyron index="07">Questions</Chyron>
          <h2 className="mt-5 text-4xl leading-none font-semibold sm:text-6xl">
            Tu te poses <span className="accent">des questions ?</span>
          </h2>
          <PillLink href="/faq" variant="outline" size="md" className="mt-8">
            Toutes les réponses
          </PillLink>
        </div>
      </div>
      <div className="lg:col-span-8">
        <FaqList items={faq.slice(0, 6)} />
      </div>
    </section>
  );
}

/* ─── CTA final ────────────────────────────────────────────────────────── */

export function FinalCta() {
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:py-36">
      <div aria-hidden className="absolute top-1/2 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 animate-breathe rounded-full bg-ocd-glow/70 blur-3xl dark:bg-ocd-orange/20" />
      <div className="relative mx-auto max-w-5xl text-center">
        <Rec label="Prochain direct · Décembre" className="justify-center text-muted-foreground" />
        <h2 className="mt-6 text-[clamp(3.4rem,13vw,10rem)] leading-[0.85] font-semibold tracking-[-0.055em]">
          Passe en <span className="accent text-ocd-orange-dark dark:text-ocd-orange">live.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-lg text-muted-foreground">Les premiers créneaux de décembre partent vite. On te confirme sur WhatsApp.</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <PillLink href="/reserver?type=presentiel">Live au studio</PillLink>
          <PillLink href="/reserver?type=distance" variant="dark">
            Live à distance
          </PillLink>
        </div>
      </div>
    </section>
  );
}
