"use client";

import { useRef } from "react";
import { m, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Chyron } from "@/components/brand/broadcast";

const TEXT =
  "Avant de vendre, il faut être vu. Chez OCD Live, tu présentes ton produit, ton numéro et ton adresse à des milliers de personnes, en direct. Ton client te découvre aujourd'hui, il t'achète demain.";

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <m.span style={{ opacity }} className="mr-[0.25em] inline-block">
      {children}
    </m.span>
  );
}

const benefits = [
  { n: "01", title: "Visibilité", text: "Ton produit vu par des milliers de personnes sur les comptes OCD Live." },
  { n: "02", title: "Contacts", text: "Ton numéro et ton adresse affichés pendant tout le live." },
  { n: "03", title: "Accompagnement", text: "Une régie pro au studio, ou une assistante dédiée à distance." },
];

/** Manifeste : les mots s'allument au fil du défilement. */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = TEXT.split(" ");

  return (
    <section id="manifeste" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-24 pb-8 sm:px-6 sm:pt-36 sm:pb-10">
      <Chyron index="01">Notre philosophie</Chyron>
      <h2 className="mt-6 text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] font-semibold">
        Le marketing <span className="accent text-ocd-orange-dark dark:text-ocd-orange">avant</span> la vente.
      </h2>
      <p ref={ref} className="mt-12 max-w-5xl text-[clamp(1.6rem,3.6vw,3rem)] leading-[1.15] font-medium tracking-[-0.025em]">
        <span className="sr-only">{TEXT}</span>
        <span aria-hidden>
          {words.map((w, i) => (
            <Word key={`${w}-${i}`} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </Word>
          ))}
        </span>
      </p>

      <ul className="mt-20 grid border-t border-foreground/15 sm:grid-cols-3">
        {benefits.map((b) => (
          <li key={b.n} className="border-b border-foreground/15 py-8 sm:border-b-0 sm:border-l sm:px-8 sm:first:border-l-0 sm:first:pl-0">
            <span className="font-mono text-xs text-accent-text">{b.n}</span>
            <h3 className="mt-3 text-3xl font-semibold">{b.title}</h3>
            <p className="mt-2 text-muted-foreground">{b.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
