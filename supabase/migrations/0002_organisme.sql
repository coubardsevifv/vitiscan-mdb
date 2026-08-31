-- Filtrage de l'accès aux parcelles par organisme notateur.
-- Chaque parcelle appartient à un organisme (ex: "ca68", "ifv"). Chaque
-- utilisateur est rattaché à un organisme par un admin (profiles.organisme).
-- Un utilisateur ne voit que les parcelles (et tout ce qui en dépend :
-- placettes, emplacements, prospections, notations) de son organisme ; un
-- admin voit tout, quel que soit son organisme.

alter table public.parcelles add column organisme text;
alter table public.profiles add column organisme text;

-- Organisme de l'utilisateur courant.
create or replace function public.user_organisme()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select organisme from public.profiles where id = auth.uid();
$$;

-- Un admin accède à tout ; sinon il faut que la parcelle appartienne au
-- même organisme que l'utilisateur (et que l'utilisateur en ait un).
create or replace function public.can_access_parcelle(target_parcelle_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.parcelles
    where id = target_parcelle_id
      and organisme is not null
      and organisme = public.user_organisme()
  );
$$;

-- ============================================================================
-- parcelles : lecture restreinte au même organisme (ou admin)
-- ============================================================================

drop policy if exists "parcelles_select_all" on public.parcelles;
create policy "parcelles_select_own_organisme"
  on public.parcelles for select
  using (public.is_admin() or (organisme is not null and organisme = public.user_organisme()));

-- ============================================================================
-- placettes / emplacements / prospections / notations : lecture restreinte
-- via l'organisme de leur parcelle
-- ============================================================================

drop policy if exists "placettes_select_all" on public.placettes;
create policy "placettes_select_own_organisme"
  on public.placettes for select
  using (public.can_access_parcelle(parcelle_id));

drop policy if exists "emplacements_select_all" on public.emplacements;
create policy "emplacements_select_own_organisme"
  on public.emplacements for select
  using (public.can_access_parcelle(parcelle_id));

drop policy if exists "prospections_select_all" on public.prospections;
create policy "prospections_select_own_organisme"
  on public.prospections for select
  using (public.can_access_parcelle(parcelle_id));

drop policy if exists "notations_select_all" on public.notations;
create policy "notations_select_own_organisme"
  on public.notations for select
  using (public.can_access_parcelle(parcelle_id));

-- Empêche aussi de créer une prospection/notation sur une parcelle qui
-- n'est pas de son organisme.
drop policy if exists "prospections_insert_own" on public.prospections;
create policy "prospections_insert_own"
  on public.prospections for insert
  with check (auth.uid() is not null and created_by = auth.uid() and public.can_access_parcelle(parcelle_id));

drop policy if exists "notations_insert_own" on public.notations;
create policy "notations_insert_own"
  on public.notations for insert
  with check (auth.uid() is not null and created_by = auth.uid() and public.can_access_parcelle(parcelle_id));

-- categories_notation reste public en lecture : ce sont des codes de
-- notation partagés, pas des données propres à une parcelle/un organisme.
