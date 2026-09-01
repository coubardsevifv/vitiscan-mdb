-- Correctif ponctuel : l'import des notations 2025 a créé un emplacement
-- en double pour la plupart des positions, car sa recherche des
-- emplacements existants était tronquée à 1000 lignes (limite par défaut
-- de PostgREST) sur une table qui en compte ~29 000. Résultat : la
-- notation 2025 se retrouvait accrochée au doublon plutôt qu'au vrai
-- emplacement déjà utilisé par l'app (bug corrigé dans le code, voir
-- src/api/entities.js — mais les doublons déjà créés restent en base).
--
-- Pour chaque paire (placette_id, numero) en double, on garde le plus
-- ancien (l'original, créé lors de l'import des placettes), on réattache
-- toute notation pointant vers le doublon, puis on supprime le doublon.

with ranked as (
  select
    id,
    placette_id,
    numero,
    row_number() over (
      partition by placette_id, numero
      order by created_at asc, id asc
    ) as rn
  from public.emplacements
),
dups as (
  select
    r_dup.id as dup_id,
    r_canon.id as canonical_id
  from ranked r_dup
  join ranked r_canon
    on r_canon.placette_id = r_dup.placette_id
   and r_canon.numero = r_dup.numero
   and r_canon.rn = 1
  where r_dup.rn > 1
)
update public.notations n
set emplacement_id = d.canonical_id
from dups d
where n.emplacement_id = d.dup_id;

with ranked as (
  select
    id,
    placette_id,
    numero,
    row_number() over (
      partition by placette_id, numero
      order by created_at asc, id asc
    ) as rn
  from public.emplacements
),
dups as (
  select id as dup_id
  from ranked
  where rn > 1
)
delete from public.emplacements e
using dups d
where e.id = d.dup_id;
