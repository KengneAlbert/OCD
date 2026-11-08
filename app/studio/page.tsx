import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Camera, Clock, Lightbulb, MapPin, MessageSquareText, Mic2, MonitorPlay, Wifi } from "lucide-react";
import { AfricaGlow } from "@/components/brand/africa-glow";
import { StudioWall } from "@/components/brand/studio-wall";
import { PageHeader, Section } from "@/components/layout/page-header";
import { MapEmbed } from "@/components/shared/map-embed";
import { Button } from "@/components/ui/button";
import { studioEquipment, studioPhotos } from "@/config/content";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Le studio de Lomé",
  description:
    "Découvre le studio OCD Live à Lomé : la carte d'Afrique lumineuse, la régie, l'équipement (caméras HD, éclairage, son) et comment venir.",
  alternates: { canonical: "/studio" },
};

const equipmentIcons = [Camera, Lightbulb, Mic2, MonitorPlay, MessageSquareText, Wifi];

export default function StudioPage() {
  const { studio } = siteConfig;
  return (
    <>
      <PageHeader
        eyebrow="Le studio"
        title="Bienvenue au studio OCD Live"
        description="Un mur blanc, une grande carte de l'Afrique en relief baignée d'un halo doré, et notre logo au centre. C'est ici, à Lomé, que les OCD passent en live."
      />

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <StudioWall />
          <div className="space-y-5">
            <h2 className="text-3xl font-extrabold">Un décor qui fait briller ton produit</h2>
            <p className="text-lg text-muted-foreground">
              Le studio a été pensé épuré et lumineux : sol blanc brillant, bureau de présentation, éclairage chaud. Ton produit est au
              centre, rien ne détourne l&apos;attention.
            </p>
            <p className="text-lg text-muted-foreground">
              La carte d&apos;Afrique rétroéclairée rappelle notre ambition : partir de Lomé pour faire rayonner les entrepreneurs de tout le
              continent et de la diaspora.
            </p>
          </div>
        </div>
      </Section>

      <div className="bg-surface">
        <Section eyebrow="Galerie" title="Le studio en images">
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {studioPhotos.map((photo) => (
              <li key={photo.caption}>
                <figure>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-white to-ocd-cream glow-card dark:from-[#1b1a19] dark:to-[#121110]">
                    {photo.src ? (
                      <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center p-6" role="img" aria-label={`${photo.alt} (photo à venir)`}>
                        <AfricaGlow showLome={false} className="w-full opacity-90" />
                        <span className="absolute bottom-3 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-muted-foreground">
                          Photo à venir
                        </span>
                      </div>
                    )}
                  </div>
                  <figcaption className="mt-2 text-sm font-medium">{photo.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section eyebrow="Équipement" title="Tout le matériel d'un vrai plateau">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {studioEquipment.map((item, i) => {
            const Icon = equipmentIcons[i] ?? Camera;
            return (
              <li key={item.title} className="rounded-3xl border border-border bg-card p-6 glow-card">
                <Icon className="mb-4 size-8 text-accent-text" aria-hidden />
                <h3 className="mb-1 text-lg font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <div className="bg-ocd-black text-white dark:bg-card">
        <Section eyebrow="La régie" title="Une équipe derrière chaque live" className="[&_h2]:text-white">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { t: "Au studio", d: "La régie dirige ton live : cadrage, changements de plan, incrustation de ton numéro et de ton adresse." },
              { t: "À distance", d: "Une animatrice au studio t'accompagne : elle anime, lit les commentaires et relance ton public." },
              { t: "Toujours", d: "Un rythme pro, des relances au bon moment, et ton produit mis en valeur du début à la fin." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="mb-2 text-lg font-bold text-ocd-orange">{x.t}</h3>
                <p className="text-white/80">{x.d}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section id="adresse" eyebrow="Venir au studio" title="Où nous trouver ?">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="space-y-5">
            <p className="flex gap-3">
              <MapPin className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
              <span>
                <strong className="block">{studio.name}</strong>
                {studio.street}, {studio.district}
                <br />
                {studio.city}, {studio.country}
              </span>
            </p>
            <p className="flex gap-3">
              <Clock className="mt-0.5 size-5 shrink-0 text-accent-text" aria-hidden />
              <span>{studio.hours}</span>
            </p>
            <p className="rounded-2xl bg-ocd-cream p-4 text-sm dark:bg-white/5">
              <strong>Pour ton live en présentiel :</strong> arrive 30 minutes avant ton créneau avec tes produits et ta liste de prix.
            </p>
            <Button asChild size="lg">
              <Link href="/reserver?type=presentiel">Réserver au studio</Link>
            </Button>
          </div>
          <MapEmbed query={studio.mapsQuery} title={`Carte : ${studio.name}, ${studio.city}`} />
        </div>
      </Section>
    </>
  );
}
