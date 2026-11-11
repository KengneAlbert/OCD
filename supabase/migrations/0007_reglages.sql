-- Réglages du site modifiables depuis l'admin (ex. ouvrir / fermer le recrutement).
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text
);
alter table public.app_settings enable row level security;

insert into public.app_settings (key, value) values ('recrutement_ouvert', 'true'::jsonb)
on conflict (key) do nothing;
