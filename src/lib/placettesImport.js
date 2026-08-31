import * as XLSX from "xlsx";
import { Parcelle, Placette, Emplacement } from "@/api/entities";

const HEADER_ALIASES = {
  parcelle: ["parcelle"],
  numero: ["n placette", "n° placette", "numero"],
  rang: ["rang"],
  emplacement_debut: ["n cep debut", "n° cep debut", "n cep début", "n° cep début"],
  nombre_emplacements: ["nombre de ceps", "nombre_emplacements"],
};

function buildHeaderIndex(headerRow) {
  const normalized = headerRow.map((h) => String(h || "").trim().toLowerCase());
  const index = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const col = normalized.findIndex((h) => aliases.includes(h));
    if (col >= 0) index[field] = col;
  }
  return index;
}

export async function importPlacettesFile(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });

  const index = buildHeaderIndex(rows[0] || []);
  const get = (row, field) => (field in index ? row[index[field]] : "");

  const [parcelles, existingPlacettes] = await Promise.all([Parcelle.list(), Placette.list()]);
  const parcelleByIdentifiant = new Map(parcelles.map((p) => [p.identifiant, p]));
  const existingKeys = new Set(existingPlacettes.map((p) => `${p.parcelle_id}-${p.numero}`));

  const created = [];
  const skipped = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const parcelleIdentifiant = String(get(row, "parcelle") || "").trim();
    if (!parcelleIdentifiant) continue;

    const parcelle = parcelleByIdentifiant.get(parcelleIdentifiant);
    if (!parcelle) {
      skipped.push({ row: i + 1, parcelle: parcelleIdentifiant, reason: "Parcelle inconnue — importez d'abord les parcelles" });
      continue;
    }

    const numero = Number(get(row, "numero"));
    const rang = String(get(row, "rang") || "").trim();
    const debut = Number(get(row, "emplacement_debut"));
    const nombre = Number(get(row, "nombre_emplacements"));

    if (!Number.isFinite(numero) || !rang || !Number.isFinite(debut) || !Number.isFinite(nombre) || nombre <= 0) {
      skipped.push({ row: i + 1, parcelle: parcelleIdentifiant, reason: "Rang, N° placette, N° cep début ou nombre de ceps manquant/invalide" });
      continue;
    }

    if (existingKeys.has(`${parcelle.id}-${numero}`)) {
      skipped.push({ row: i + 1, parcelle: parcelleIdentifiant, reason: `Placette n°${numero} déjà existante pour cette parcelle` });
      continue;
    }
    existingKeys.add(`${parcelle.id}-${numero}`);

    try {
      const placette = await Placette.create({
        parcelle_id: parcelle.id,
        numero,
        rang,
        nombre_emplacements: nombre,
        emplacement_debut: debut,
        emplacement_fin: debut + nombre - 1,
      });
      const emplacements = await Emplacement.bulkCreate(
        Array.from({ length: nombre }, (_, j) => ({
          parcelle_id: parcelle.id,
          placette_id: placette.id,
          numero: debut + j,
          identifiant_stable: `${parcelle.identifiant}-P${numero}-E${debut + j}`,
        }))
      );
      created.push({ placette, emplacements: emplacements.length });
    } catch (err) {
      skipped.push({ row: i + 1, parcelle: parcelleIdentifiant, reason: err.message || "Erreur d'import" });
    }
  }

  return { created, skipped };
}
