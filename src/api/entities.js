import { supabase } from './base44Client';

// Sort strings follow the old Base44 convention: "field" = ascending,
// "-field" = descending.
function applySort(query, sort) {
  if (!sort) return query;
  const descending = sort.startsWith('-');
  const column = descending ? sort.slice(1) : sort;
  return query.order(column, { ascending: !descending });
}

// PostgREST caps a response at 1000 rows by default — several tables here
// (emplacements, notations) comfortably exceed that. Page through with
// .range() so list()/filter() always return every matching row.
const PAGE_SIZE = 1000;

async function fetchAllPages(baseQuery) {
  const rows = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await baseQuery.range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

function makeEntity(table) {
  return {
    async list(sort) {
      return fetchAllPages(applySort(supabase.from(table).select('*'), sort));
    },
    async filter(match, sort) {
      return fetchAllPages(applySort(supabase.from(table).select('*').match(match), sort));
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
