import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section } from "@/components/layout/page-header";
import { Prose } from "@/components/shared/prose";
import { bookingConditions, forbiddenContent } from "@/config/content";
import { siteConfig } from "@/config/site";
import { PAYMENT_SUMMARY } from "@/config/payment-methods";

export const metadata: Metadata = {
  title: "Mentions légales et conditions de réservation",
  description: "Mentions légales du site OCD Live et conditions de réservation des lives.",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  const { studio } = siteConfig;
  return (
    <>
      <PageHeader title="Mentions légales" description="Dernière mise à jour : novembre 2026" />
      <Section>
        <Prose>
          <h2>Éditeur du site</h2>
          <p>
            <strong>{siteConfig.name}</strong> — [forme juridique à compléter]
            <br />
            Siège : {studio.street}, {studio.city}, {studio.country}
            <br />
            RCCM : [à compléter] · NIF : [à compléter]
            <br />
            Téléphone : {siteConfig.phoneDisplay} · Email : <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            <br />
            Directeur·rice de la publication : [à compléter]
          </p>

          <h2>Conception et réalisation</h2>
          <p>
            Site conçu et réalisé par <strong>{siteConfig.agency.name}</strong>.
          </p>

          <h2>Hébergement</h2>
          <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com</p>

          <h2>Propriété intellectuelle</h2>
          <p>
            Le nom OCD Live, le logo, le décor du studio, les textes et visuels de ce site sont la propriété d&apos;OCD Live. Toute
            reproduction sans autorisation écrite est interdite.
          </p>

          <h2 id="conditions">Conditions de réservation</h2>
          <h3>Réservation et confirmation</h3>
          <p>
            La demande envoyée depuis le site ne vaut pas réservation définitive. L&apos;équipe OCD Live
            confirme la disponibilité du créneau par email. Le créneau est bloqué après réception du paiement.
          </p>
          <h3>Règles applicables</h3>
          <ul>
            {bookingConditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <h3>Prix et paiement</h3>
          <p>
            Les prix sont indiqués en francs CFA (FCFA) sur la page <Link href="/packages">Packages</Link>. Le paiement s&apos;effectue
            en ligne au moment de la réservation, via Swinmo Pay : {PAYMENT_SUMMARY}. La réservation n&apos;est validée qu&apos;après
            paiement.
          </p>
          <h3>Report et annulation</h3>
          <p>
            Le live peut être reporté une fois jusqu&apos;à 48 heures avant le créneau, selon les disponibilités. Passé ce délai, ou en
            cas d&apos;absence, le live est considéré comme dû. En cas d&apos;empêchement du fait d&apos;OCD Live (panne, coupure majeure),
            un nouveau créneau est proposé sans frais.
          </p>
          <h3>Contenus interdits</h3>
          <p>OCD Live se réserve le droit de refuser ou d&apos;interrompre sans remboursement un live présentant :</p>
          <ul>
            {forbiddenContent.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <h3>Responsabilité du vendeur</h3>
          <p>
            Le vendeur est seul responsable des produits et services qu&apos;il présente, de leurs prix, de leur conformité et de la
            relation commerciale avec ses clients. OCD Live fournit un service de visibilité et d&apos;accompagnement, et n&apos;intervient
            pas dans les ventes.
          </p>
          <h3>Droit à l&apos;image</h3>
          <p>
            En réservant un live, le vendeur accepte d&apos;être filmé et que le live (et ses extraits) soit diffusé sur les comptes
            d&apos;OCD Live à des fins de promotion.
          </p>
        </Prose>
      </Section>
    </>
  );
}
