import * as XLSX from "xlsx";
import { Parcelle } from "@/api/entities";

// Column headers expected on row 1 of the import file (case-insensitive).
// "identifiant" is optional — when absent, "nom_parcelle" (or "nom") is used
// for both the parcelle's identifiant and nom.
const HEADER_ALIASES = {
  identifiant: ["identifiant"],
  nom: ["nom_parcelle", "nom"],
  commune: ["commune"],
  cepage: ["cepage", "cépage"],
  latitude: ["latitude"],
  longitude: ["longitude"],
  organisme: ["organisme_notateur", "organisme"],
  exploitant: ["exploitant"],
  annee_entree: ["annee_entree", "année_entree", "année_entrée"],
  informations: ["informations"],
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

const REQUIRED = ["nom", "commune", "cepage"];

export async function importParcellesFile(file, existingIdentifiants) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });

  const index = buildHeaderIndex(rows[0] || []);
  const created = [];
  const skipped = [];
  const seen = new Set();

  const get = (row, field) => (field in index ? row[index[field]] : "");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const nom = String(get(row, "nom") || "").trim();
    if (!nom) continue;

    const identifiant = String(get(row, "identifiant") || nom).trim();
    const record = {
      identifiant,
      nom,
      commune: String(get(row, "commune") || "").trim(),
      cepage: String(get(row, "cepage") || "").trim(),
    };

    const missing = REQUIRED.filter((k) => !record[k]);
    if (missing.length) {
      skipped.push({ row: i + 1, identifiant, reason: `Champs manquants: ${missing.join(", ")}` });
      continue;
    }
    if (existingIdentifiants.has(identifiant) || seen.has(identifiant)) {
      skipped.push({ row: i + 1, identifiant, reason: "Identifiant déjà existant" });
      continue;
    }
    seen.add(identifiant);

    const latitude = get(row, "latitude");
    const longitude = get(row, "longitude");
    const anneeEntree = get(row, "annee_entree");

    const payload = {
      ...record,
      latitude: latitude !== "" ? Number(latitude) : undefined,
      longitude: longitude !== "" ? Number(longitude) : undefined,
      organisme: get(row, "organisme") ? String(get(row, "organisme")).trim() : undefined,
      exploitant: get(row, "exploitant") ? String(get(row, "exploitant")).trim() : undefined,
      annee_entree: anneeEntree !== "" ? Number(anneeEntree) : undefined,
      informations: get(row, "informations") ? String(get(row, "informations")).trim() : undefined,
      active: true,
    };

    try {
      created.push(await Parcelle.create(payload));
    } catch (err) {
      skipped.push({ row: i + 1, identifiant, reason: err.message || "Erreur d'import" });
    }
  }

  return { created, skipped };
}
