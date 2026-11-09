-- ═══════════════════════════════════════════════════════════════════════
-- OCD Live — paiements Mobile Money (Swinmo Pay)
-- À exécuter après 0001_init.sql.
-- ═══════════════════════════════════════════════════════════════════════

-- Jeton secret du lien de paiement envoyé au client (/paiement/<jeton>).
alter table public.reservations
  add column if not exists pay_token text unique default encode(gen_random_bytes(18), 'hex');

update public.reservations set pay_token = encode(gen_random_bytes(18), 'hex') where pay_token is null;
alter table public.reservations alter column pay_token set not null;

-- Une ligne par tentative de paiement (session de checkout Swinmo).
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  provider        text not null default 'swinmo',
  environment     text not null,                      -- test | live
  session_id      text unique,                        -- cs_test_… / cs_live_…
  charge_id       text unique,                        -- ch_test_… / ch_live_…
  reference       text not null unique,               -- référence envoyée à Swinmo
  status          text not null default 'open'
                  check (status in ('open', 'processing', 'succeeded', 'failed', 'expired')),
  amount          integer not null,                   -- montant attendu (FCFA)
  currency        text not null default 'XOF',
  fee             integer,
  net             integer,
  operator        text,
  phone           text,
  failure_reason  text,
  raw             jsonb,                              -- dernière version de l'objet Charge
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists payments_reservation_idx on public.payments (reservation_id, created_at desc);
create index if not exists payments_status_idx on public.payments (status);

drop trigger if exists payments_touch on public.payments;
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

alter table public.payments enable row level security;

-- Le journal accepte aussi les événements de paiement.
alter table public.activity_log drop constraint if exists activity_log_entity_type_check;
alter table public.activity_log add constraint activity_log_entity_type_check
  check (entity_type in ('reservation', 'candidature', 'system', 'payment'));
