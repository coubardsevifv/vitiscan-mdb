-- VitiScan MDB — schéma initial Supabase (migration depuis Base44)
-- Entités source : base44/entities/{Parcelle,Placette,Emplacement,Prospection,Notation,CategorieNotation,User}.jsonc

-- ============================================================================
-- Extensions & fonctions utilitaires
-- ============================================================================

create extension if not exists "pgcrypto";

-- Maintient updated_at à jour sur chaque UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles (équivalent de l'entité "User" Base44)
-- Base44 gère l'auth + un profil utilisateur (id, email, full_name, role).
-- Supabase gère l'auth dans auth.users ; on stocke le profil applicatif ici,
-- avec le champ métier "statut" propre à VitiScan.
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  statut text not null default 'actif' check (statut in ('actif', 'inactif')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crée automatiquement un profil à l'inscription d'un utilisateur Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fonction utilitaire pour les policies : évite la récursion RLS sur profiles
-- en lisant le rôle avec les droits du définisseur.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- parcelles
-- ============================================================================

create table public.parcelles (
  id uuid primary key default gen_random_uuid(),
  identifiant text not null,
  nom text not null,
  commune text not null,
  cepage text not null,
  latitude double precision,
  longitude double precision,
  exploitant text,
  annee_entree integer,
  informations text,
  active boolean not null default true,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger parcelles_set_updated_at
  before update on public.parcelles
  for each row execute function public.set_updated_at();

-- ============================================================================
-- placettes
-- ============================================================================

create table public.placettes (
  id uuid primary key default gen_random_uuid(),
  parcelle_id uuid not null references public.parcelles (id) on delete cascade,
  numero integer not null,
  rang text not null,
  nombre_emplacements integer not null,
  emplacement_debut integer not null,
  emplacement_fin integer not null,
  repere text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index placettes_parcelle_id_idx on public.placettes (parcelle_id);

create trigger placettes_set_updated_at
  before update on public.placettes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- emplacements
-- ============================================================================

create table public.emplacements (
  id uuid primary key default gen_random_uuid(),
  parcelle_id uuid not null references public.parcelles (id) on delete cascade,
  placette_id uuid not null references public.placettes (id) on delete cascade,
  numero integer not null,
  identifiant_stable text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index emplacements_parcelle_id_idx on public.emplacements (parcelle_id);
create index emplacements_placette_id_idx on public.emplacements (placette_id);

create trigger emplacements_set_updated_at
  before update on public.emplacements
  for each row execute function public.set_updated_at();

-- ============================================================================
-- categories_notation
-- ============================================================================

create table public.categories_notation (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  libelle text not null,
  couleur text not null,
  ordre integer not null,
  active boolean not null default true,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_notation_set_updated_at
  before update on public.categories_notation
  for each row execute function public.set_updated_at();

-- ============================================================================
-- prospections
-- ============================================================================

create table public.prospections (
  id uuid primary key default gen_random_uuid(),
  parcelle_id uuid not null references public.parcelles (id) on delete cascade,
  annee integer not null,
  utilisateur_id uuid references auth.users (id),
  utilisateur_nom text,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'en_cours', 'terminee')),
  date_debut timestamptz,
  date_fin timestamptz,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prospections_parcelle_id_idx on public.prospections (parcelle_id);

create trigger prospections_set_updated_at
  before update on public.prospections
  for each row execute function public.set_updated_at();

-- ============================================================================
-- notations
-- ============================================================================

create table public.notations (
  id uuid primary key default gen_random_uuid(),
  prospection_id uuid not null references public.prospections (id) on delete cascade,
  parcelle_id uuid not null references public.parcelles (id) on delete cascade,
  placette_id uuid not null references public.placettes (id) on delete cascade,
  emplacement_id uuid not null references public.emplacements (id) on delete cascade,
  numero_emplacement integer not null,
  rang text,
  annee integer not null,
  code text not null,
  utilisateur_id uuid references auth.users (id),
  utilisateur_nom text,
  date_saisie timestamptz,
  hors_ligne boolean not null default false,
  created_by uuid references auth.users (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notations_prospection_id_idx on public.notations (prospection_id);
create index notations_placette_id_idx on public.notations (placette_id);
create index notations_emplacement_id_idx on public.notations (emplacement_id);

create trigger notations_set_updated_at
  before update on public.notations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS — activation
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.parcelles enable row level security;
alter table public.placettes enable row level security;
alter table public.emplacements enable row level security;
alter table public.categories_notation enable row level security;
alter table public.prospections enable row level security;
alter table public.notations enable row level security;

-- ============================================================================
-- RLS — profiles
-- Lecture publique (les prénoms/noms sont affichés dans l'UI), écriture
-- restreinte à soi-même ou à un admin. Pas d'INSERT/DELETE en RLS : la ligne
-- est créée par le trigger handle_new_user() (security definer).
-- ============================================================================

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_self_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

create policy "profiles_delete_admin"
  on public.profiles for delete
  using (public.is_admin());

-- ============================================================================
-- RLS — parcelles / placettes / emplacements / categories_notation
-- Lecture publique, écriture (create/update/delete) réservée aux admins.
-- Équivalent des règles Base44 : rls.read = {} / rls.create|update|delete =
-- user_condition.role = "admin".
-- ============================================================================

create policy "parcelles_select_all"
  on public.parcelles for select
  using (true);
create policy "parcelles_write_admin"
  on public.parcelles for insert
  with check (public.is_admin());
create policy "parcelles_update_admin"
  on public.parcelles for update
  using (public.is_admin())
  with check (public.is_admin());
create policy "parcelles_delete_admin"
  on public.parcelles for delete
  using (public.is_admin());

create policy "placettes_select_all"
  on public.placettes for select
  using (true);
create policy "placettes_write_admin"
  on public.placettes for insert
  with check (public.is_admin());
create policy "placettes_update_admin"
  on public.placettes for update
  using (public.is_admin())
  with check (public.is_admin());
create policy "placettes_delete_admin"
  on public.placettes for delete
  using (public.is_admin());

create policy "emplacements_select_all"
  on public.emplacements for select
  using (true);
create policy "emplacements_write_admin"
  on public.emplacements for insert
  with check (public.is_admin());
create policy "emplacements_update_admin"
  on public.emplacements for update
  using (public.is_admin())
  with check (public.is_admin());
create policy "emplacements_delete_admin"
  on public.emplacements for delete
  using (public.is_admin());

create policy "categories_notation_select_all"
  on public.categories_notation for select
  using (true);
create policy "categories_notation_write_admin"
  on public.categories_notation for insert
  with check (public.is_admin());
create policy "categories_notation_update_admin"
  on public.categories_notation for update
  using (public.is_admin())
  with check (public.is_admin());
create policy "categories_notation_delete_admin"
  on public.categories_notation for delete
  using (public.is_admin());

-- ============================================================================
-- RLS — prospections / notations
-- Lecture publique. Création par l'utilisateur connecté (created_by =
-- auth.uid()). Modification par l'auteur ou un admin. Suppression réservée
-- aux admins. Équivalent des règles Base44 :
--   rls.create.created_by_id = "{{user.id}}"
--   rls.update.$or = [created_by_id = user.id, role = admin]
--   rls.delete.user_condition.role = "admin"
-- ============================================================================

create policy "prospections_select_all"
  on public.prospections for select
  using (true);
create policy "prospections_insert_own"
  on public.prospections for insert
  with check (auth.uid() is not null and created_by = auth.uid());
create policy "prospections_update_own_or_admin"
  on public.prospections for update
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());
create policy "prospections_delete_admin"
  on public.prospections for delete
  using (public.is_admin());

create policy "notations_select_all"
  on public.notations for select
  using (true);
create policy "notations_insert_own"
  on public.notations for insert
  with check (auth.uid() is not null and created_by = auth.uid());
create policy "notations_update_own_or_admin"
  on public.notations for update
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());
create policy "notations_delete_admin"
  on public.notations for delete
  using (public.is_admin());
