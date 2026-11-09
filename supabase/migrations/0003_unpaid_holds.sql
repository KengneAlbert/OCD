-- Pas de réservation sans paiement.
-- « nouvelle » = créneau bloqué le temps de payer (20 min).
-- « expiree » = tentative jamais payée : ce n'est pas une réservation, le créneau est libre.
alter type public.reservation_status add value if not exists 'expiree';

-- Le créneau est libre pour les réservations annulées ET les tentatives expirées.
-- (Nouvelle transaction : la valeur d'enum ajoutée ci-dessus doit être validée avant usage.)
commit;
drop index if exists public.reservations_slot_unique;
create unique index reservations_slot_unique
  on public.reservations (live_date, slot_start)
  where status not in ('annulee', 'expiree');

-- Les tentatives déjà libérées automatiquement passent en « expiree ».
update public.reservations r
   set status = 'expiree'
 where r.status = 'annulee'
   and exists (
     select 1 from public.activity_log a
      where a.entity_id = r.id and a.meta @> '{"reason":"hold_expired"}'::jsonb
   );
