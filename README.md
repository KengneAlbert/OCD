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
| `NOTIFICATION_PROVIDER`       | `whatsapp`                 | `whatsapp` (phase 1), `brevo` (phase 2) ou `both`                  |
| `BREVO_API_KEY`               | `xkeysib-…`                | Clé API Brevo (phase 2)                                           |
| `BREVO_SENDER_EMAIL`          | `reservations@ocdlive.com` | Expéditeur **validé** dans Brevo                                  |
| `OCD_TEAM_EMAIL`              | `equipe@ocdlive.com`       | Adresse de l'équipe qui reçoit les réservations                   |

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
  notifications/           index.ts (abstraction) · provider.ts · brevo.ts (serveur)
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

## Envoi des réservations

```
sendReservation(reservation)        lib/notifications/index.ts
 ├─ whatsapp → ouvre https://wa.me/<NUMÉRO>?text=<message>  (phase 1)
 └─ brevo    → POST /api/reservations → lib/notifications/brevo.ts  (phase 2)
```

Le message WhatsApp est construit par `buildReservationMessage()` (`lib/whatsapp.ts`), avec une référence `OCD-XXXXXX` générée par `generateReference()`.

### Activer Brevo (phase 2)
1. Créer un compte [Brevo](https://www.brevo.com), valider l'expéditeur (`Senders & IP`) et générer une clé API (`SMTP & API`).
2. Sur Vercel, renseigner `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `OCD_TEAM_EMAIL`.
3. Passer `NOTIFICATION_PROVIDER=brevo` (emails seuls) ou `both` (WhatsApp + emails).
4. Redéployer. C'est tout : l'email devient obligatoire dans le formulaire, l'équipe reçoit chaque réservation et le client un email de confirmation.

Protections de l'API : validation zod côté serveur, vérification du créneau, champ piège (honeypot) anti-spam, limite de 5 requêtes / 10 min / IP (en mémoire ; passer à Upstash Redis pour une limite globale multi-instances).

## Déploiement Vercel

1. Importer le dépôt dans Vercel (framework détecté automatiquement).
2. Renseigner les variables d'environnement.
3. Déployer. `sitemap.xml`, `robots.txt` et l'image Open Graph sont générés automatiquement.

## Évolutions prévues (structure prête)

| Évolution | Où brancher |
|---|---|
| **Paiement Mobile Money** (FedaPay / CinetPay / KkiaPay : T-Money, Flooz, MTN, Orange Money, Wave, carte) | Bouton dans `components/booking/step-summary.tsx` + Route Handler `app/api/payments/` + webhook de confirmation |
| **Base de données** (Supabase ou Postgres + Prisma) | Remplacer `scheduleConfig.unavailableSlots` par une requête dans `getSlotsForDate()` ; enregistrer la réservation dans `app/api/reservations/route.ts` |
| **Tableau de bord admin** (statuts en attente / confirmée / terminée, export CSV) | `app/admin/` protégé par authentification |
| **Rappel automatique 24h avant** | Vercel Cron → Route Handler qui envoie l'email Brevo |
| **Multilingue FR/EN** | `next-intl` : extraire les textes de `config/` et des composants |

## Accessibilité et performance

- Contraste AA : texte noir sur les boutons orange, orange foncé (`--accent-text`) pour les textes sur fond clair
- Focus visibles, labels et messages d'erreur reliés aux champs (`aria-describedby`)
- Calendrier navigable au clavier (flèches, Début/Fin, Page précédente/suivante)
- Options du tunnel en boutons radio natifs (navigation au clavier)
- Pas de librairie lourde ; Google Maps chargé seulement au clic ; animations désactivées si « réduire les animations »
