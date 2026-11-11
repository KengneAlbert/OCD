-- Marketplace : produits et services des abonnés, contact par WhatsApp.
-- Toujours RLS activé sans policy : lectures et écritures passent par le serveur (clé service).

create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  subscriber_id   uuid not null references public.subscribers(id) on delete cascade,
  kind            text not null default 'produit' check (kind in ('produit', 'service')),
  title           text not null,
  description     text,
  price           integer check (price is null or price >= 0),   -- FCFA ; null = prix sur demande
  category        text not null default 'autres',
  image_path      text,                                          -- chemin dans le bucket « produits »
  status          text not null default 'actif' check (status in ('actif', 'masque')),
  hidden_by_admin boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists products_sub_idx on public.products (subscriber_id, created_at desc);
create index if not exists products_public_idx on public.products (status, hidden_by_admin, category, created_at desc);

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
alter table public.products enable row level security;

-- Photos : bucket public en lecture (les envois passent par le serveur).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produits', 'produits', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Journal : nouveau type d'entité.
alter table public.activity_log drop constraint if exists activity_log_entity_type_check;
alter table public.activity_log add constraint activity_log_entity_type_check
  check (entity_type in ('reservation', 'candidature', 'system', 'payment', 'subscriber', 'live', 'product'));
