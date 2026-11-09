-- ═══════════════════════════════════════════════════════════════════════
-- OCD Live — schéma initial
-- À exécuter une fois dans Supabase > SQL Editor (ou `supabase db push`).
--
-- Sécurité : RLS activé partout et AUCUNE policy publique. Seul le serveur
-- Next.js (clé service_role, jamais exposée au navigateur) lit et écrit.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─── Types ────────────────────────────────────────────────────────────
do $$ begin
  create type reservation_status as enum ('nouvelle', 'confirmee', 'payee', 'realisee', 'annulee', 'absente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type candidature_status as enum ('nouvelle', 'en_revue', 'entretien', 'retenue', 'refusee');
exception when duplicate_object then null; end $$;

-- ─── Réservations ─────────────────────────────────────────────────────
create table if not exists public.reservations (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique,
  status              reservation_status not null default 'nouvelle',
  live_type           text not null check (live_type in ('presentiel', 'distance')),
  live_date           date not null,
  slot_start          text not null,           -- "HH:mm", heure de Lomé
  slot_end            text not null,
  package_id          text not null,
  package_name        text not null,
  package_price       integer not null,        -- FCFA, figé au moment de la réservation
  full_name           text not null,
  business_name       text not null,
  category            text not null,
  category_other      text,
  product_description text not null,
  product_count       text,
  phone_country       text not null,
  phone_number        text not null,
  phone_e164          text not null,
  email               text,
  country             text,
  city                text,
  shop_address        text,
  tiktok              text,
  facebook            text,
  instagram           text,
  special_needs       text,
  visitor_timezone    text,
  channel             text not null default 'whatsapp', -- canal actif lors de la réservation
  admin_notes         text,
  payload             jsonb not null,          -- copie brute de la réservation validée
  ip_hash             text,
  user_agent          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists reservations_date_idx on public.reservations (live_date, slot_start);
create index if not exists reservations_status_idx on public.reservations (status);
create index if not exists reservations_created_idx on public.reservations (created_at desc);

-- Un seul live par créneau (le studio et l'animatrice sont partagés).
-- Les réservations annulées libèrent le créneau.
create unique index if not exists reservations_slot_unique
  on public.reservations (live_date, slot_start)
  where status not in ('annulee');

-- ─── Candidatures animatrices ─────────────────────────────────────────
create table if not exists public.candidatures (
  id                    uuid primary key default gen_random_uuid(),
  reference             text not null unique,
  status                candidature_status not null default 'nouvelle',
  full_name             text not null,
  age                   integer,
  location              text,
  phone_country         text not null,
  phone_number          text not null,
  phone_e164            text not null,
  email                 text,
  languages             text[] not null default '{}',
  availability          text[] not null default '{}',
  has_sales_experience  boolean,
  experience_details    text,
  video_url             text,
  motivation            text,
  admin_notes           text,
  payload               jsonb not null,
  ip_hash               text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists candidatures_status_idx on public.candidatures (status);
create index if not exists candidatures_created_idx on public.candidatures (created_at desc);

-- ─── Journal d'activité (traçabilité) ─────────────────────────────────
create table if not exists public.activity_log (
  id           bigint generated always as identity primary key,
  entity_type  text not null check (entity_type in ('reservation', 'candidature', 'system')),
  entity_id    uuid,
  action       text not null,   -- created, status_changed, note_updated, email_sent, email_failed…
  message      text not null,
  meta         jsonb not null default '{}',
  actor        text not null default 'système',
  created_at   timestamptz not null default now()
);

create index if not exists activity_entity_idx on public.activity_log (entity_type, entity_id, created_at desc);
create index if not exists activity_created_idx on public.activity_log (created_at desc);

-- ─── Emails envoyés ───────────────────────────────────────────────────
create table if not exists public.email_log (
  id           bigint generated always as identity primary key,
  entity_type  text,
  entity_id    uuid,
  template     text not null,
  to_email     text not null,
  subject      text not null,
  status       text not null check (status in ('sent', 'failed')),
  message_id   text,
  error        text,
  created_at   timestamptz not null default now()
);

create index if not exists email_entity_idx on public.email_log (entity_type, entity_id);
create index if not exists email_created_idx on public.email_log (created_at desc);

-- ─── updated_at automatique ───────────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists reservations_touch on public.reservations;
create trigger reservations_touch before update on public.reservations
  for each row execute function public.touch_updated_at();

drop trigger if exists candidatures_touch on public.candidatures;
create trigger candidatures_touch before update on public.candidatures
  for each row execute function public.touch_updated_at();

-- ─── Sécurité : RLS sans policy = aucun accès via la clé anon ──────────
alter table public.reservations enable row level security;
alter table public.candidatures enable row level security;
alter table public.activity_log enable row level security;
alter table public.email_log    enable row level security;
