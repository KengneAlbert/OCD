import type { Metadata } from "next";
import { PageHeader, Section } from "@/components/layout/page-header";
import { Prose } from "@/components/shared/prose";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment OCD Live collecte, utilise et protège tes données personnelles.",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <>
      <PageHeader title="Politique de confidentialité" description="Dernière mise à jour : novembre 2026" />
      <Section>
        <Prose>
          <p>
            OCD Live attache une grande importance à la protection de tes données personnelles, conformément à la loi togolaise
            n° 2019-014 du 29 octobre 2019 relative à la protection des données à caractère personnel.
          </p>

          <h2>Données collectées</h2>
          <ul>
            <li>
              <strong>Réservation :</strong> nom, nom du business, catégorie, description des produits, téléphone WhatsApp, email,
              pays et ville, adresse de la boutique, liens vers tes réseaux sociaux, message libre.
            </li>
            <li>
              <strong>Candidature :</strong> nom, âge, quartier et ville, téléphone, langues, expérience, lien vidéo, disponibilités,
              motivation.
            </li>
            <li>
              <strong>Contact :</strong> nom et message.
            </li>
          </ul>

          <h2>Pourquoi ?</h2>
          <ul>
            <li>Traiter ta demande de réservation et te confirmer ton créneau ;</li>
            <li>Préparer ton live (affichage de ton numéro, de ton adresse et de tes réseaux pendant la diffusion) ;</li>
            <li>Étudier ta candidature ;</li>
            <li>Répondre à tes questions.</li>
          </ul>
          <p>Tes données ne sont jamais vendues ni utilisées pour de la publicité ciblée.</p>

          <h2>Comment sont-elles transmises ?</h2>
          <p>
            Quand tu valides un formulaire, un message pré-rempli s&apos;ouvre dans <strong>WhatsApp</strong> (service de Meta) : c&apos;est
            toi qui l&apos;envoies à l&apos;équipe. Si l&apos;envoi par email est activé, tes informations sont transmises via{" "}
            <strong>Brevo</strong> (prestataire d&apos;emails transactionnels). Le site est hébergé par <strong>Vercel</strong>.
          </p>

          <h2>Durée de conservation</h2>
          <ul>
            <li>Réservations : 3 ans après le dernier live (obligations comptables) ;</li>
            <li>Candidatures : 12 mois maximum ;</li>
            <li>Messages de contact : 12 mois maximum.</li>
          </ul>

          <h2>Stockage dans ton navigateur</h2>
          <p>
            Le site n&apos;utilise pas de cookies publicitaires. Il garde temporairement ta réservation en cours dans ton navigateur
            (sessionStorage, effacé à la fermeture de l&apos;onglet) et ton choix de mode clair/sombre (localStorage). La carte Google
            Maps n&apos;est chargée que si tu cliques sur « Afficher la carte ».
          </p>

          <h2>Tes droits</h2>
          <p>
            Tu peux à tout moment demander l&apos;accès, la rectification ou la suppression de tes données, ou t&apos;opposer à leur
            traitement, en écrivant à <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> ou sur WhatsApp. Tu peux aussi
            saisir l&apos;Instance de Protection des Données à Caractère Personnel (IPDCP) du Togo.
          </p>
        </Prose>
      </Section>
    </>
  );
}
