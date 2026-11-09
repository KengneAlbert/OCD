# OCD Live

Plateforme de réservation de lives de vente et de présentation de produits, basée à **Lomé (Togo)** et ouverte à toute l'Afrique et au monde.
*« Le marketing avant la vente. »* Lancement le **1er décembre 2026**.

Site réalisé par **REVOLUTION**.

---

## Stack

- **Next.js 15** (App Router) · **TypeScript strict** · **Tailwind CSS v4** · composants façon **shadcn/ui**
- **react-hook-form + zod** (validation client et serveur) · **date-fns** (locale `fr`)
- **Framer Motion** (chargé en `LazyMotion`, respecte « réduire les animations »)
- Polices via `next/font` : **Outfit** (titres) + **Inter** (texte)
- Tests unitaires **Vitest** sur les fonctions pures (créneaux, message WhatsApp, validation)

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables
npm run dev                  # http://localhost:3000
```

| Script              | Rôle                                |
| ------------------- | ----------------------------------- |
| `npm run dev`       | serveur de développement            |
| `npm run build`     | build de production                 |
| `npm run start`     | lance le build de production        |
| `npm run lint`      | ESLint                              |
| `npm run typecheck` | vérification TypeScript             |
| `npm test`          | tests unitaires (Vitest)            |

## Variables d'environnement

| Variable                      | Exemple                    | Rôle                                                              |
| ----------------------------- | -------------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`        | `https://ocdlive.com`      | URL publique (SEO, sitemap, Open Graph)                           |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `22890123456`              | Numéro qui reçoit les réservations (**sans `+` ni espaces**)      |
| `NOTIFICATION_PROVIDER`       | `whatsapp`                 | Candidatures uniquement : `whatsapp`, `brevo` ou `both` (les réservations partent toujours par email) |
| `BREVO_API_KEY`               | `xkeysib-…`                | Clé API Brevo (phase 2)                                           |
| `BREVO_SENDER_EMAIL`          | `reservations@ocdlive.com` | Expéditeur **validé** dans Brevo                                  |
| `OCD_TEAM_EMAIL`              | `equipe@ocdlive.com`       | Adresse de l'équipe qui reçoit les réservations                   |
| `BREVO_SENDER_NAME`           | `OCD Live`                 | Nom de l'expéditeur (facultatif)                                   |
| `NEXT_PUBLIC_SUPABASE_URL`    | `https://xxx.supabase.co`  | Projet Supabase (stockage + admin)                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…`                   | Clé publique (connexion à l'admin)                                 |
| `SUPABASE_SERVICE_ROLE_KEY`   | `eyJ…`                     | Clé **secrète**, serveur uniquement (lecture / écriture des données) |
| `ADMIN_EMAILS`                | `a@ocdlive.com,b@ocdlive.com` | Emails autorisés à se connecter à `/admin`                     |
| `SWINMO_SECRET_KEY`           | `sk_test_…` / `sk_live_…`  | Clé secrète Swinmo Pay (paiement Mobile Money)                    |
| `SWINMO_WEBHOOK_SECRET`       | `…`                        | Secret du webhook Swinmo (vérification de signature)              |

> ⚠️ Les variables `NEXT_PUBLIC_*` et `NOTIFICATION_PROVIDER` sont lues **au build** : après modification sur Vercel, relancer un déploiement.

## Arborescence

```
app/
  layout.tsx               Layout global (bandeau, header, footer, bouton WhatsApp, JSON-LD LocalBusiness)
  page.tsx                 Accueil
  reserver/                Tunnel de réservation (6 étapes)
  confirmation/            Récapitulatif + référence après envoi
  packages/                Les 6 packages + tableau comparatif
  comment-ca-marche/       Étapes, déroulé du jour J, checklist, conditions
  studio/                  Le studio de Lomé, équipement, régie, carte
  recrutement/             Candidature animatrice / assistante live
  faq/  contact/  mentions-legales/  confidentialite/
  api/reservations/        POST — phase 2 Brevo (zod, honeypot, rate limit)
  api/candidatures/        POST — idem pour les candidatures
  sitemap.ts  robots.ts  opengraph-image.tsx  icon.svg
config/                    ⚙️ Tout ce qui se modifie sans toucher aux composants
  site.ts                  Coordonnées, adresse du studio, réseaux, navigation
  packages.ts              Packages et prix
  schedule.ts              Jours ouvrés, jours fermés, créneaux, horizon
  countries.ts             Pays + indicatifs (Afrique en tête)
  categories.ts            Catégories d'activité
  content.ts               FAQ, checklist, conditions, équipement, photos, témoignages
types/                     Types partagés
lib/
  schedule.ts              Fonctions pures : créneaux, dates réservables, fuseaux
  whatsapp.ts              Fonctions pures : messages WhatsApp + lien wa.me
  booking.ts               Étapes du tunnel, validation, objet Reservation
  reference.ts             Référence unique OCD-XXXXXX
  validation/              Schémas zod (réservation, candidature)
  notifications/           index.ts (abstraction) · provider.ts
  emails/                  layout.ts · templates.ts (gabarits) · send.ts (Brevo + journal) · samples.ts
  db/                      reservations.ts · admin-queries.ts · activity.ts (Supabase, serveur)
  supabase/                clients service_role / session · env.ts
  admin/                   auth.ts · actions.ts (server actions) · status.ts · filters.ts
  rate-limit.ts  storage.ts  utils.ts
components/
  booking/                 BookingProvider, Stepper, BookingCalendar, StepType, StepDate,
                           StepSlot, StepPackage, StepInfo, StepSummary, ReservationRecap…
  brand/                   Logo, AfricaGlow (carte lumineuse), LiveBadge, StudioWall
  home/  layout/  packages/  recruit/  forms/  shared/  seo/  motion/  ui/
tests/                     Tests Vitest
public/logo-ocd-live.svg   Logo (placeholder à remplacer)
```

## Modifier les contenus

### Prix et packages → `config/packages.ts`
Chaque package : `name`, `price`, `originalPrice` (prix barré), `livesLabel`, `includes` (liste des inclus), `compatibleWith` (`presentiel` / `distance`), `highlighted` (affiché sur l'accueil), `popular` (badge « Populaire »), `features` (lignes du tableau comparatif).

### Créneaux et jours d'ouverture → `config/schedule.ts`
- `workingDays` : jours ouverts (`0` = dimanche … `6` = samedi)
- `closedDates` : jours fermés exceptionnels (`"2026-12-25"`)
- `dayStart`, `dayEnd`, `slotDurationMinutes`, `bufferMinutes` : génération automatique des créneaux
- `bookingHorizonDays` : nombre de jours réservables (60)
- `unavailableSlots` : créneaux déjà pris, ex. `{ "2026-12-01": ["10:00", "14:00"] }`

### Coordonnées, adresse, réseaux → `config/site.ts`
### FAQ, conditions, équipement, photos du studio, témoignages → `config/content.ts`
Pour les photos : déposer les fichiers dans `public/studio/` puis renseigner `src: "/studio/mur.jpg"`. `next/image` les sert automatiquement en AVIF/WebP.

### Logo
Remplacer `public/logo-ocd-live.svg` par le fichier officiel (même nom). Aucun autre changement.

## Envoi et stockage des réservations

```
sendReservation(reservation)              lib/notifications/index.ts
 ├─ POST /api/reservations (toujours)
 │   ├─ validation zod + honeypot + rate limit + créneau valide
 │   ├─ enregistrement Supabase (si configuré) → un créneau ne peut être pris qu'une fois
 │   └─ emails Brevo : confirmation au client + alerte à l'équipe
 └─ (pas de WhatsApp : les réservations partent uniquement par email)
```

**Les réservations sont envoyées uniquement par email** (`RESERVATION_PROVIDER = "brevo"` dans `lib/notifications/provider.ts`) : l'email du client est obligatoire, et Brevo **doit** être configuré en production (sinon la réservation n'est acceptée que si Supabase l'a enregistrée). `NOTIFICATION_PROVIDER` ne règle plus que les **candidatures** (WhatsApp, email ou les deux). Les créneaux déjà réservés sont lus via `GET /api/availability` et affichés « Complet » dans le tunnel.

### Brancher Supabase (stockage + admin)
1. Créer un projet sur [Supabase](https://supabase.com).
2. **SQL Editor** → coller et exécuter `supabase/migrations/0001_init.sql` (tables `reservations`, `candidatures`, `activity_log`, `email_log`, RLS activé sans accès public).
3. **Authentication → Users → Add user** : créer un compte (email + mot de passe) par membre de l'équipe. Désactiver les inscriptions publiques (**Authentication → Sign In / Providers → Allow new users to sign up : off**).
4. Renseigner `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` et `ADMIN_EMAILS` (les mêmes emails), puis redéployer.

### Activer Brevo (emails)
1. Créer un compte [Brevo](https://www.brevo.com), valider l'expéditeur et le domaine (`Senders, Domains & Dedicated IPs`, enregistrements DKIM / DMARC) et générer une clé API (`SMTP & API`).
2. Renseigner `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `OCD_TEAM_EMAIL`.
3. Redéployer. Les réservations partent alors par email. Pour les candidatures, choisir `NOTIFICATION_PROVIDER=brevo` (email) ou `both`.

### Emails envoyés (`lib/emails/templates.ts`)
| Email | Destinataire | Déclencheur |
|---|---|---|
| Demande reçue | Client | Automatique à la réservation (si email) |
| Nouvelle réservation | Équipe | Automatique, avec lien vers la fiche admin |
| Créneau confirmé (+ message, paiement, checklist) | Client | Statut « Confirmée » dans l'admin |
| Paiement reçu | Client | Statut « Payée » |
| Rappel J-1 | Client | Bouton dans la fiche admin |
| Merci après le live | Client | Statut « Réalisée » |
| Réservation annulée (+ motif) | Client | Statut « Annulée » |
| Candidature reçue / alerte équipe | Candidate / équipe | Automatique |
| Invitation à l'essai, retenue, non retenue | Candidate | Statut dans l'admin |

Aperçu de tous les gabarits (desktop, mobile, texte brut) : **Admin → Emails**. Chaque envoi est journalisé (`email_log`) avec son statut et l'éventuelle erreur Brevo.

### Espace admin (`/admin`)
- **Tableau de bord** : réservations à traiter, lives à venir, chiffre encaissé, graphique des 14 derniers jours.
- **Réservations** : recherche (référence, nom, business, téléphone), filtres statut / type / dates, tri par date de live, export CSV (compatible Excel).
- **Fiche réservation** : toutes les infos, boutons WhatsApp / appel / email, changement de statut avec email automatique au client, rappel J-1, notes internes, historique complet et emails envoyés.
- **Candidatures** : même logique (statuts, emails, notes, historique).
- **Journal** : toutes les actions (création, changement de statut, note, email, connexion, export) avec l'auteur et l'heure.

Sécurité : le middleware redirige vers `/admin/connexion`, chaque page et action vérifie la session **et** la présence de l'email dans `ADMIN_EMAILS`. Les données ne sont lues qu'avec la clé service_role, côté serveur ; la clé publique ne donne accès à aucune table (RLS sans policy).

Protections de l'API : validation zod côté serveur, vérification du créneau, honeypot anti-spam, limite de 5 requêtes / 10 min / IP (en mémoire ; passer à Upstash Redis pour une limite globale multi-instances).

## Paiement Mobile Money (Swinmo Pay)

```
Réservation enregistrée → lien /paiement/<jeton secret> (page de confirmation + emails)
  └─ « Payer » → POST /api/payments/session  (montant lu en base, jamais dans le navigateur)
       └─ modale Swinmo (inline.js) : T-Money, Moov Money, Orange, MTN, Wave…
            ├─ onSuccess → POST /api/payments/confirm → GET /v1/charges/:id chez Swinmo
            └─ webhook charge.succeeded / charge.failed → POST /api/payments/webhook (signature HMAC vérifiée)
                 └─ applyCharge() : contrôle montant + devise + référence, une seule fois
                      → réservation « Payée » + email « Paiement reçu » + journal
```

**Mise en place**
1. Exécuter `supabase/migrations/0002_payments.sql` (table `payments` + jeton de paiement sur chaque réservation).
2. Créer un compte sur [Swinmo Pay](https://pay.swinmo.shop), copier la clé `sk_test_…` dans `SWINMO_SECRET_KEY`.
3. Dans le tableau de bord Swinmo, déclarer le webhook `https://<domaine>/api/payments/webhook` et copier son secret dans `SWINMO_WEBHOOK_SECRET`.
4. Tester en sandbox : un numéro finissant par **55** échoue (fonds insuffisants), par **99** échoue (PIN refusé), tout autre numéro réussit.
5. Après validation KYB, remplacer par la clé `sk_live_…` et déclarer le webhook live avec son propre secret.

Les webhooks Swinmo ne sont **jamais renvoyés** : le retour navigateur (`/api/payments/confirm`) et le bouton **« Vérifier auprès de Swinmo »** de la fiche admin servent de rattrapage. Frais Swinmo : 2,5 % par paiement réussi, à la charge d'OCD Live (le net est visible dans l'admin). Les prix sont en FCFA (XOF) ; un client hors zone XOF paie dans sa devise, convertie par Swinmo.

## Déploiement Vercel

1. Importer le dépôt dans Vercel (framework détecté automatiquement).
2. Renseigner les variables d'environnement.
3. Déployer. `sitemap.xml`, `robots.txt` et l'image Open Graph sont générés automatiquement.

## Évolutions prévues (structure prête)

| Évolution | Où brancher |
|---|---|
| **Rappel J-1 automatique** | Vercel Cron → Route Handler qui appelle `reservationReminderEmail()` pour les lives du lendemain (le rappel manuel existe déjà dans l'admin) |
| **Multilingue FR/EN** | `next-intl` : extraire les textes de `config/` et des composants |

## Accessibilité et performance

- Contraste AA : texte noir sur les boutons orange, orange foncé (`--accent-text`) pour les textes sur fond clair
- Focus visibles, labels et messages d'erreur reliés aux champs (`aria-describedby`)
- Calendrier navigable au clavier (flèches, Début/Fin, Page précédente/suivante)
- Options du tunnel en boutons radio natifs (navigation au clavier)
- Pas de librairie lourde ; Google Maps chargé seulement au clic ; animations désactivées si « réduire les animations »
