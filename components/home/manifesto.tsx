import { Chyron } from "@/components/brand/broadcast";
import { LivesStrip } from "@/components/lives/lives-strip";

const benefits = [
  { n: "01", title: "Visibilité", text: "Ton produit vu par des milliers de personnes sur les comptes OCD Live." },
  { n: "02", title: "Contacts", text: "Ton numéro et ton adresse affichés pendant tout le live." },
  { n: "03", title: "Accompagnement", text: "Une régie pro au studio, ou une assistante dédiée à distance." },
];

/** Manifeste : le titre, les lives en cours, les trois bénéfices. */
export function Manifesto() {
  return (
    <section id="manifeste" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-24 pb-8 sm:px-6 sm:pt-36 sm:pb-10">
      <Chyron index="01">Notre philosophie</Chyron>
      <h2 className="mt-6 text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.95] font-semibold">
        Le marketing <span className="accent text-ocd-orange-dark dark:text-ocd-orange">avant</span> la vente.
      </h2>

      <LivesStrip className="mt-12 sm:mt-14" />

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
