-- ═══════════════════════════════════════════════════════════════════════
-- Tâche des paiements toutes les 5 minutes (Supabase pg_cron + pg_net).
-- À exécuter UNE FOIS dans Supabase → SQL Editor, après avoir remplacé
-- les deux valeurs entre chevrons. Les secrets sont rangés dans Vault.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 1. Adresse du site en production et secret partagé (même valeur que CRON_SECRET sur Vercel).
select vault.create_secret('<https://ton-domaine>', 'ocd_site_url', 'Adresse publique du site OCD Live');
select vault.create_secret('<CRON_SECRET>', 'ocd_cron_secret', 'Secret envoyé à /api/cron/payments');

-- 2. Appel toutes les 5 minutes.
select cron.schedule(
  'ocd-paiements',
  '*/5 * * * *',
  $$
  select net.http_get(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'ocd_site_url') || '/api/cron/payments',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'ocd_cron_secret')
    ),
    timeout_milliseconds := 55000
  );
  $$
);

-- Vérifier : select * from cron.job;  ·  Historique : select * from cron.job_run_details order by start_time desc limit 20;
-- Réponses HTTP : select id, status_code, content from net._http_response order by created desc limit 20;
-- Arrêter : select cron.unschedule('ocd-paiements');
-- Changer un secret : select vault.update_secret((select id from vault.secrets where name = 'ocd_cron_secret'), '<nouveau>');
