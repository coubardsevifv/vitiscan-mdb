-- Notes de terrain (réutilise la colonne "informations" existante), sens de
-- comptage des rangs, et plan de la parcelle en image.

alter table public.parcelles add column notes_updated_at timestamptz;
alter table public.parcelles add column sens_comptage text check (sens_comptage in ('gauche_droite', 'droite_gauche'));
alter table public.parcelles add column plan_image_url text;

-- Les notes de terrain doivent être modifiables par n'importe quel
-- prospecteur connecté, pas seulement les admins (comme pour les
-- prospections/notations). Le reste de la fiche parcelle (identifiant,
-- cépage, organisme...) reste en pratique modifié uniquement depuis l'admin,
-- mais la policy ne peut pas restreindre par colonne : c'est le même niveau
-- de confiance que pour prospections/notations.
drop policy if exists "parcelles_update_admin" on public.parcelles;
create policy "parcelles_update_own_organisme_or_admin"
  on public.parcelles for update
  using (auth.uid() is not null and public.can_access_parcelle(id))
  with check (auth.uid() is not null and public.can_access_parcelle(id));

-- Bucket public pour les plans de parcelles (images).
insert into storage.buckets (id, name, public)
values ('parcelle-plans', 'parcelle-plans', true)
on conflict (id) do nothing;

create policy "parcelle_plans_select_all"
  on storage.objects for select
  using (bucket_id = 'parcelle-plans');

create policy "parcelle_plans_write_admin"
  on storage.objects for insert
  with check (bucket_id = 'parcelle-plans' and public.is_admin());

create policy "parcelle_plans_update_admin"
  on storage.objects for update
  using (bucket_id = 'parcelle-plans' and public.is_admin());

create policy "parcelle_plans_delete_admin"
  on storage.objects for delete
  using (bucket_id = 'parcelle-plans' and public.is_admin());
