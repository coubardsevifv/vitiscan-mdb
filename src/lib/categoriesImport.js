import * as XLSX from "xlsx";
import { CategorieNotation } from "@/api/entities";

const HEADER_ALIASES = {
  code: ["code"],
  libelle: ["libelle", "libellé"],
  couleur: ["couleur"],
  ordre: ["ordre"],
  active: ["active"],
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

export async function importCategoriesFile(file, existingCodes) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });

  const index = buildHeaderIndex(rows[0] || []);
  const get = (row, field) => (field in index ? row[index[field]] : "");

  const created = [];
  const skipped = [];
  const seen = new Set();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = String(get(row, "code") || "").trim();
    if (!code) continue;

    const libelle = String(get(row, "libelle") || "").trim();
    const couleur = String(get(row, "couleur") || "").trim();
    const ordreRaw = get(row, "ordre");

    if (!libelle || !couleur || ordreRaw === "") {
      skipped.push({ row: i + 1, identifiant: code, reason: "Champs manquants: libelle, couleur ou ordre" });
      continue;
    }
    if (existingCodes.has(code) || seen.has(code)) {
      skipped.push({ row: i + 1, identifiant: code, reason: "Code déjà existant" });
      continue;
    }
    seen.add(code);

    const activeRaw = String(get(row, "active") || "").trim().toLowerCase();
    const active = activeRaw === "" || ["1", "true", "vrai", "oui", "yes"].includes(activeRaw);

    try {
      created.push(await CategorieNotation.create({ code, libelle, couleur, ordre: Number(ordreRaw), active }));
    } catch (err) {
      skipped.push({ row: i + 1, identifiant: code, reason: err.message || "Erreur d'import" });
    }
  }

  return { created, skipped };
}
