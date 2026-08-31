import { supabase } from './base44Client';

// Sort strings follow the old Base44 convention: "field" = ascending,
// "-field" = descending.
function applySort(query, sort) {
  if (!sort) return query;
  const descending = sort.startsWith('-');
  const column = descending ? sort.slice(1) : sort;
  return query.order(column, { ascending: !descending });
}

function makeEntity(table) {
  return {
    async list(sort) {
      const { data, error } = await applySort(supabase.from(table).select('*'), sort);
      if (error) throw error;
      return data;
    },
    async filter(match, sort) {
      const { data, error } = await applySort(supabase.from(table).select('*').match(match), sort);
      if (error) throw error;
      return data;
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    async create(values) {
      const { data, error } = await supabase.from(table).insert(values).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, values) {
      const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    async bulkCreate(records) {
      const { data, error } = await supabase.from(table).insert(records).select();
      if (error) throw error;
      return data;
    },
  };
}

export const Parcelle = makeEntity('parcelles');
export const Placette = makeEntity('placettes');
export const Emplacement = makeEntity('emplacements');
export const Prospection = makeEntity('prospections');
export const Notation = makeEntity('notations');
export const CategorieNotation = makeEntity('categories_notation');
