-- Annuaire des lives TikTok : catégories, ville, photo.
-- Complète 0004. Toujours RLS activé sans policy : tout passe par le serveur (clé service).

alter table public.subscribers
  add column if not exists city       text,
  add column if not exists category   text not null default 'autres',
  add column if not exists avatar_url text;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'live_submissions' and column_name = 'tiktok_url') then
    alter table public.live_submissions rename column tiktok_url to url;
  end if;
end $$;

alter table public.live_submissions
  add column if not exists platform text not null default 'tiktok' check (platform = 'tiktok'),
  add column if not exists category text not null default 'autres';

create index if not exists live_submissions_dir_idx on public.live_submissions (status, country, category, ends_at);
