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
| `CRON_SECRET`                 | chaîne aléatoire (≥ 16)    | Protège la tâche du matin `/api/cron/daily` (envoyé par Vercel Cron) |

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
  - L'interrupteur **« Recrutement ouvert »**, en haut de la page, ajoute ou retire l'onglet « Recrutement » du menu et du pied de page.
  - Recrutement fermé : `/recrutement` affiche « Pas de recrutement en ce moment » (non indexée), l'API refuse les candidatures (403) et la page sort du sitemap.
  - Le réglage est stocké dans la table `app_settings` (migration `0007_reglages.sql`) et lu avec un cache invalidé à chaque changement depuis l'admin (`lib/settings.ts`).
- **Journal** : toutes les actions (création, changement de statut, note, email, connexion, export) avec l'auteur et l'heure.

Sécurité : le middleware redirige vers `/admin/connexion`, chaque page et action vérifie la session **et** la présence de l'email dans `ADMIN_EMAILS`. Les données ne sont lues qu'avec la clé service_role, côté serveur ; la clé publique ne donne accès à aucune table (RLS sans policy).

Protections de l'API : validation zod côté serveur, vérification du créneau, honeypot anti-spam, limite de 5 requêtes / 10 min / IP (en mémoire ; passer à Upstash Redis pour une limite globale multi-instances).

## Paiement Mobile Money (Swinmo Pay)

```
Réservation enregistrée → lien /paiement/<jeton secret> (page de confirmation + emails)
  └─ « Payer » → POST /api/payments/session  (montant lu en base, jamais dans le navigateur)
       └─ modale Swinmo (inline.js) : Mobile Money (18 pays) ou carte Visa / Mastercard (config/payment-methods.ts)
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

## Annuaire des lives en direct et abonnement vendeurs

- **Visiteurs** :
  - `/live` : nombre de vendeurs en live, « Mon pays » (détecté par l'en-tête `x-vercel-ip-country`, modifiable, mémorisé dans le cookie `ocd_pays`), liste des pays en live, lives « À la une ».
  - `/live/[pays]` : tuiles de catégories avec le nombre de lives, puis tous les lives du pays.
  - `/live/[pays]/[categorie]` : tuiles verticales 9:16 façon TikTok LIVE (image de fond par catégorie, cœurs qui montent, coupés si « réduire les animations »), WhatsApp et Partager (Web Share API, sinon WhatsApp). Images : `liveCover()` dans `config/live-categories.ts`.
  - Les pages se rafraîchissent toutes les 60 s et sont indexables (titres « Lives business au Togo – Mode », sitemap des pays mis en avant).
  - Les réservations OCD payées dont le créneau est en cours sont toujours « À la une ».
- **Vendeurs** :
  - `/connexion` (ou `/inscription`) : Google ou lien magique.
  - `/moi` : profil (business, pays, ville, catégorie, WhatsApp, TikTok facultatif), abonnement **5 000 FCFA / 30 jours** payé via Swinmo (références `ABO-…`), historique des lives.
  - `/je-suis-en-live` : coller le lien, pays et catégorie pré-remplis, puis « Envoyer ». **Uniquement TikTok** (liens tiktok.com/@compte/live et liens courts vm./vt.tiktok.com) ; le lien doit correspondre au compte TikTok du profil (obligatoire).
  - L'envoi n'est possible que **pendant les créneaux de validation**. En dehors, le bouton est désactivé et un compte à rebours s'affiche.
  - Un seul live à la fois par vendeur.
- **Durée d'affichage** : un live validé disparaît à la fin du créneau + 1 h, ou quand le vendeur ou l'équipe touche « Terminé ». L'expiration est appliquée à la lecture, donc aucune tâche planifiée n'est nécessaire.
- **Admin** :
  - `/admin/lives` : file d'attente rechargée toutes les 15 s, avec un son quand un live arrive (bouton « Activer le son ») et le nombre en attente dans l'onglet. Chaque live a « Ouvrir le live », « Valider », et « Refuser » avec un motif en un tap.
  - `/admin/abonnes` : liste des abonnés, « +30 j » (paiement hors ligne) et « Suspendre ».
- **Réglages** :
  - Créneaux : `config/validation-windows.ts` (8h–11h et 18h–21h, heure de Lomé).
  - Catégories : `config/live-categories.ts`.
  - Le reste : `config/lives.ts`.
- **Tables** : migrations `0004_lives_abonnements.sql` et `0005_annuaire.sql`. Le rappel de renouvellement part 3 jours avant la fin, dans la tâche du matin.
- **Google** : Supabase → Authentication → Providers → Google (Client ID / Secret d'un projet Google Cloud) ; ajouter `https://<domaine>/auth/callback` aux Redirect URLs (Authentication → URL Configuration). Les inscriptions doivent rester **activées** (abonnés) : l'accès admin reste limité par `ADMIN_EMAILS`.

## Marketplace

- **Public** :
  - `/marketplace` : grille de produits et services, avec recherche (`q`), pays (`pays`), type (`type`) et catégorie (`categorie`), tous dans l'adresse.
  - `/marketplace/[id]` : fiche produit avec « Commander sur WhatsApp » (message pré-rempli avec le nom, le prix et le lien), Partager, bandeau « En live maintenant » si le vendeur est en live, et les autres produits du vendeur. Open Graph avec la photo.
- **Visibilité** : un produit est visible seulement si l'abonné est actif (abonnement payé, compte non suspendu), a un numéro WhatsApp, n'a pas masqué le produit, et que l'équipe ne l'a pas retiré.
- **Vendeurs** (`/moi/produits`) :
  - jusqu'à **12 produits** ;
  - ajout en 3 champs (photo → prix → nom), avec type, catégorie et description facultatifs ;
  - modifier, masquer, supprimer.
  - Les photos sont compressées dans le navigateur (1200 px, JPEG) puis envoyées par Server Action dans le bucket Supabase Storage public `produits` (3 Mo max, JPG/PNG/WebP).
- **Admin** (`/admin/marketplace`) : liste de tous les produits avec leur statut, Masquer / Réafficher / Supprimer.
- **Réglages** : `config/marketplace.ts`.
- **Table** : migration `0006_marketplace.sql`, qui crée aussi le bucket.

## Tâche du matin (Vercel Cron)

`vercel.json` programme `GET /api/cron/daily` tous les jours à **6 h (heure de Lomé = UTC)** :

1. rappel J-1 (`reservation-rappel`) aux clients dont le live payé ou confirmé est le lendemain (jamais envoyé deux fois) ;
2. récap du jour (`equipe-recap`) à `OCD_TEAM_EMAIL` : lives du jour, nombre de lives demain, encaissements de la veille, anomalies de paiement.

Renseigner `CRON_SECRET` sur Vercel : Vercel l'envoie dans `Authorization: Bearer …`, la route refuse tout autre appel. Test manuel : `curl -H "Authorization: Bearer $CRON_SECRET" https://<domaine>/api/cron/daily`.

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
