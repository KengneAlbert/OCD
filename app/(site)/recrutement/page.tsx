import type { Metadata } from "next";
import Link from "next/link";
import { Award, Heart, MessageCircle, Sparkles, Users } from "lucide-react";
import { LiveBadge } from "@/components/brand/live-badge";
import { PageHeader, Section } from "@/components/layout/page-header";
import { CandidatureForm } from "@/components/recruit/candidature-form";
import { getSettings } from "@/lib/settings";

const openMetadata: Metadata = {
  title: "Recrutement : animatrice / assistante live",
  description:
    "OCD Live recrute à Lomé une animatrice / assistante live pour accompagner les vendeurs en direct. Aucun diplôme exigé : on donne la chance à tous les talents.",
  alternates: { canonical: "/recrutement" },
};

export async function generateMetadata(): Promise<Metadata> {
  const { recrutementOuvert } = await getSettings();
  return recrutementOuvert ? openMetadata : { title: "Recrutement", robots: { index: false, follow: true } };
}

const missions = [
  "Accompagner en direct, depuis le studio, les vendeurs qui font leur live à distance",
  "Présenter les vendeurs et leurs produits avec énergie",
  "Lire et répondre aux commentaires, relancer le public",
  "Rappeler le numéro et l'adresse du vendeur au bon moment",
];

const profile = [
  { icon: MessageCircle, text: "Tu es à l'aise à l'oral, devant une caméra comme devant un client" },
  { icon: Sparkles, text: "Tu es présentable, souriante et dynamique" },
  { icon: Award, text: "Tu sais vendre et convaincre" },
  { icon: Heart, text: "Tu es sérieuse, ponctuelle et fiable" },
];

export default async function RecrutementPage() {
  const { recrutementOuvert } = await getSettings();
  if (!recrutementOuvert) {
    return (
      <div className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Pas de recrutement en ce moment.</h1>
        <p className="mt-4 text-lg text-muted-foreground">Reviens bientôt : les prochaines offres seront publiées ici.</p>
        <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-foreground px-6 font-semibold text-background hover:opacity-90">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="On recrute à Lomé"
        title="Deviens animatrice / assistante live"
        description="Aucun diplôme exigé, juste ton talent pour parler et vendre. On donne la chance à tous les talents."
      >
        <LiveBadge label="POSTE OUVERT" />
      </PageHeader>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-6 glow-card sm:p-8">
            <h2 className="mb-5 text-2xl font-extrabold">Le poste</h2>
            <ul className="space-y-3">
              {missions.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-ocd-orange" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-2xl bg-ocd-cream p-4 text-sm dark:bg-white/5">
              <strong>Lieu :</strong> studio OCD Live, Lomé (Togo). Horaires selon le planning des lives, entre 8h et 22h.
            </p>
          </article>
          <article className="rounded-3xl border border-border bg-card p-6 glow-card sm:p-8">
            <h2 className="mb-5 text-2xl font-extrabold">Le profil recherché</h2>
            <p className="mb-4 text-muted-foreground">Jeune femme dynamique, tu te reconnais ici ?</p>
            <ul className="space-y-4">
              {profile.map((p) => (
                <li key={p.text} className="flex gap-3">
                  <p.icon className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
                  <span>{p.text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex items-center gap-2 font-semibold">
              <Users className="size-5 text-accent-text" aria-hidden />
              Aucun diplôme exigé.
            </p>
          </article>
        </div>
      </Section>

      <div className="bg-surface">
        <Section id="postuler" eyebrow="Candidature" title="Postule en 2 minutes" description="Remplis le formulaire : ta candidature arrive directement à l'équipe sur WhatsApp.">
          <div className="mx-auto max-w-2xl">
            <CandidatureForm />
          </div>
        </Section>
      </div>
    </>
  );
}
