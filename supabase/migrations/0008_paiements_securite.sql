-- Sécurisation des paiements : montant réellement payé, date de vérification chez Swinmo,
-- statut « amount_mismatch », compteurs de relance (paiements abandonnés ou échoués).

alter table public.payments
  add column if not exists paid_amount      integer,       -- montant payé, relu chez Swinmo (GET /v1/charges/:id)
  add column if not exists verified_at      timestamptz,   -- dernière vérification chez Swinmo
  add column if not exists reminder_count   integer not null default 0,
  add column if not exists last_reminder_at timestamptz;
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('open', 'processing', 'succeeded', 'failed', 'expired', 'amount_mismatch'));

alter table public.subscription_payments
  add column if not exists paid_amount      integer,
  add column if not exists verified_at      timestamptz,
  add column if not exists reminder_count   integer not null default 0,
  add column if not exists last_reminder_at timestamptz;
alter table public.subscription_payments drop constraint if exists subscription_payments_status_check;
alter table public.subscription_payments add constraint subscription_payments_status_check
  check (status in ('open', 'processing', 'succeeded', 'failed', 'expired', 'amount_mismatch'));

-- Relances des réservations non payées (une réservation peut avoir plusieurs tentatives).
alter table public.reservations
  add column if not exists reminder_count   integer not null default 0,
  add column if not exists last_reminder_at timestamptz;

-- Tâche de rapprochement : tentatives non finales.
create index if not exists payments_pending_idx on public.payments (created_at) where status in ('open', 'processing');
create index if not exists subscription_payments_pending_idx on public.subscription_payments (created_at) where status in ('open', 'processing');
