import type { Metadata } from "next";
import Link from "next/link";
import { Ban, CheckCircle2, Globe2, Mic } from "lucide-react";
import { HowItWorks, PrepareChecklist } from "@/components/home/sections";
import { PageHeader, Section } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { bookingConditions, forbiddenContent } from "@/config/content";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description:
    "Réserver un live OCD Live en 4 étapes, déroulé d'un live au studio de Lomé ou à distance, checklist de préparation et conditions de réservation.",
  alternates: { canonical: "/comment-ca-marche" },
};

const timelines = [
  {
    icon: Mic,
    title: "Ton live au studio",
    steps: [
      { when: "Après ta réservation", what: "L'équipe te confirme le créneau et le paiement sur WhatsApp." },
      { when: "La veille", what: "Rappel sur WhatsApp et derniers conseils pour ta présentation." },
      { when: "Jour J, 30 min avant", what: "Tu arrives au studio, on installe tes produits et on règle la lumière." },
      { when: "Pendant 1h30", what: "La régie lance le live : tu présentes, ton numéro et ton adresse s'affichent." },
      { when: "Après le live", what: "Tes nouveaux clients te contactent directement." },
    ],
  },
  {
    icon: Globe2,
    title: "Ton live à distance",
    steps: [
      { when: "Après ta réservation", what: "L'équipe te confirme le créneau et le paiement sur WhatsApp." },
      { when: "Avant le jour J", what: "Test de connexion avec l'équipe : image, son, cadrage." },
      { when: "Jour J, 15 min avant", what: "Tu te connectes, l'assistante OCD fait un dernier point avec toi." },
      { when: "Pendant 1h30", what: "Tu présentes depuis chez toi, l'assistante anime depuis le studio de Lomé." },
      { when: "Après le live", what: "Tes nouveaux clients te contactent directement." },
    ],
  },
];

export default function CommentCaMarchePage() {
  return (
    <>
      <PageHeader
        eyebrow="Comment ça marche"
        title="De la réservation au direct"
        description="Tout est pensé pour que tu n'aies qu'une chose à faire : présenter ton produit avec le sourire."
      />

      <HowItWorks />

      <div className="bg-surface">
        <Section eyebrow="Le jour J" title="Le déroulé de ton live">
          <div className="grid gap-6 lg:grid-cols-2">
            {timelines.map((t) => (
              <article key={t.title} className="rounded-[2rem] border border-border bg-card p-6 glow-card sm:p-8">
                <h3 className="mb-6 flex items-center gap-3 text-2xl font-extrabold">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-ocd-black text-ocd-orange dark:bg-white/10">
                    <t.icon className="size-6" aria-hidden />
                  </span>
                  {t.title}
                </h3>
                <ol className="relative space-y-6 border-l-2 border-ocd-glow pl-6 dark:border-ocd-orange/30">
                  {t.steps.map((s) => (
                    <li key={s.when} className="relative">
                      <span aria-hidden className="absolute top-1 -left-[1.95rem] size-3.5 rounded-full border-2 border-card bg-ocd-orange shadow-[0_0_10px_rgb(255_217_160)]" />
                      <p className="text-sm font-bold text-accent-text">{s.when}</p>
                      <p>{s.what}</p>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </Section>
      </div>

      <PrepareChecklist id="preparer" />

      <div className="bg-surface">
        <Section id="conditions" eyebrow="Les règles" title="Conditions de réservation">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h3 className="mb-4 text-xl font-bold">Bon à savoir</h3>
              <ul className="space-y-3">
                {bookingConditions.map((c) => (
                  <li key={c} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
              <h3 className="mb-4 text-xl font-bold">Contenus interdits</h3>
              <ul className="space-y-3">
                {forbiddenContent.map((c) => (
                  <li key={c} className="flex gap-3">
                    <Ban className="mt-0.5 size-5 shrink-0 text-ocd-live" aria-hidden />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Conditions complètes dans les{" "}
            <Link href="/mentions-legales#conditions" className="font-semibold text-accent-text underline underline-offset-4">
              mentions légales
            </Link>
            .
          </p>
        </Section>
      </div>

      <Section title="On y va ?">
        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/reserver">Réserver mon live</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
