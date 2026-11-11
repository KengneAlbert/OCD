-- Lives TikTok en cours + abonnement mensuel (5 000 FCFA) pour proposer ses lives.
-- Les abonnés se connectent avec Supabase Auth (Google ou lien magique) ;
-- toutes les écritures passent par le serveur (clé service) : RLS activé, aucune policy.

-- ─── Abonnés ──────────────────────────────────────────────────────────
create table if not exists public.subscribers (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  full_name      text not null,
  business_name  text not null,
  country        text not null,                 -- code ISO (TG, CI…), sert au regroupement par pays
  tiktok_handle  text not null,                 -- sans le @
  phone_e164     text,
  status         text not null default 'actif' check (status in ('actif', 'suspendu')),
  paid_until     timestamptz,                   -- abonnement valable jusqu'à cette date
  admin_notes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists subscribers_paid_idx on public.subscribers (paid_until);
create unique index if not exists subscribers_tiktok_unique on public.subscribers (lower(tiktok_handle));

-- ─── Paiements d'abonnement (Swinmo) ──────────────────────────────────
create table if not exists public.subscription_payments (
  id             uuid primary key default gen_random_uuid(),
  subscriber_id  uuid not null references public.subscribers(id) on delete cascade,
  environment    text not null default 'test',
  session_id     text unique,
  charge_id      text,
  reference      text not null unique,          -- « ABO-XXXXXX »
  status         text not null default 'open' check (status in ('open', 'processing', 'succeeded', 'failed', 'expired')),
  amount         integer not null,
  currency       text not null default 'XOF',
  fee            integer,
  net            integer,
  operator       text,
  failure_reason text,
  raw            jsonb,
  paid_at        timestamptz,
  period_end     timestamptz,                   -- fin de la période payée
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists subscription_payments_sub_idx on public.subscription_payments (subscriber_id, created_at desc);

-- ─── Lives proposés par les abonnés ───────────────────────────────────
create table if not exists public.live_submissions (
  id             uuid primary key default gen_random_uuid(),
  subscriber_id  uuid not null references public.subscribers(id) on delete cascade,
  tiktok_url     text not null,
  title          text not null,
  country        text not null,
  status         text not null default 'en_attente' check (status in ('en_attente', 'valide', 'refuse', 'termine')),
  ends_at        timestamptz not null,          -- fin prévue du live (retiré automatiquement ensuite)
  reviewed_at    timestamptz,
  reviewed_by    text,
  reject_reason  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists live_submissions_status_idx on public.live_submissions (status, ends_at);
create index if not exists live_submissions_sub_idx on public.live_submissions (subscriber_id, created_at desc);

-- updated_at automatique (fonction créée en 0001).
drop trigger if exists subscribers_touch on public.subscribers;
create trigger subscribers_touch before update on public.subscribers for each row execute function public.touch_updated_at();
drop trigger if exists subscription_payments_touch on public.subscription_payments;
create trigger subscription_payments_touch before update on public.subscription_payments for each row execute function public.touch_updated_at();
drop trigger if exists live_submissions_touch on public.live_submissions;
create trigger live_submissions_touch before update on public.live_submissions for each row execute function public.touch_updated_at();

alter table public.subscribers enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.live_submissions enable row level security;

-- Journal : nouveaux types d'entités.
alter table public.activity_log drop constraint if exists activity_log_entity_type_check;
alter table public.activity_log add constraint activity_log_entity_type_check
  check (entity_type in ('reservation', 'candidature', 'system', 'payment', 'subscriber', 'live'));
