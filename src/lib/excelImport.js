import * as XLSX from "xlsx";

import { base44 } from "@/api/base44Client";

export const YEAR_IMPORT = 2025;

const SAINE_CODE = "S";

function isParcelleSheet(rows) {

  if (!rows || rows.length < 5) return false;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {

    if (String(rows[i]?.[0] || "").includes("N° de rang")) return true;

  }

  return false;

}

export async function parseWorkbook(file) {

  const buf = await file.arrayBuffer();

  const wb = XLSX.read(buf, { type: "array" });

  return wb.SheetNames.map(name => {

    const sheet = wb.Sheets[name];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false });

    return { name, rows, isParcelle: isParcelleSheet(rows) };

  });

}

function findLabelRow(rows, label) {

  for (let i = 0; i < Math.min(rows.length, 10); i++) {

    if (String(rows[i]?.[0] || "").includes(label)) return i;

  }

  return -1;

}

export async function analyzeImport(allSheets) {

  const parcelleSheets = allSheets.filter(s => s.isParcelle);

  const [parcelles, placettes, emplacements, categories, existing] = await Promise.all([

    base44.entities.Parcelle.list(), base44.entities.Placette.list(), base44.entities.Emplacement.list(),

    base44.entities.CategorieNotation.filter({ active: true }), base44.entities.Notation.filter({ annee: YEAR_IMPORT }),

  ]);

  const catCodes = new Set(categories.map(c => c.code));

  const errors = [];

  const s = {

    parcellesReconnues: new Set(), parcellesInconnues: new Set(),

    placettesReconnues: 0, placettesCreees: 0,

    emplacementsReconnus: 0, emplacementsNouveaux: 0,

    notations: 0, valeursInconnues: 0, doublons: 0, donneesManquantes: 0,

  };

  const toImport = [];

  const seen = new Set();

  const existingKeys = new Set(existing.map(n => n.emplacement_id));

  for (const pSheet of parcelleSheets) {

    const rows = pSheet.rows;

    const rangRowIdx = findLabelRow(rows, "N° de rang");

    const debutRowIdx = findLabelRow(rows, "N° du cep");

    if (rangRowIdx < 0 || debutRowIdx < 0) continue;

    const matrixStart = debutRowIdx + 1;

    const parcelleCode = String(rows[0]?.[2] || pSheet.name || "").trim();

    const parcelle = parcelles.find(p => p.identifiant === parcelleCode || p.identifiant === pSheet.name);

    if (!parcelle) {

      s.parcellesInconnues.add(parcelleCode);

      errors.push({ sheet: pSheet.name, row: 1, type: "parcelle_inconnue", message: `Parcelle inconnue: "${parcelleCode}" — créez-la dans l'admin` });

      continue;

    }

    s.parcellesReconnues.add(parcelleCode);

    const rangRow = rows[rangRowIdx] || [];

    const totauxCol = rangRow.findIndex(c => String(c || "").includes("Totaux"));

    const lastCol = totauxCol > 0 ? totauxCol : rangRow.length;

    for (let col = 1; col < lastCol; col++) {

      const rang = rangRow[col];

      const debut = rows[debutRowIdx]?.[col];

      if (rang === undefined || rang === null || String(rang).trim() === "") continue;

      const rangStr = String(rang).trim();

      const debutNum = Number(debut) || 1;

      let placette = placettes.find(p => p.parcelle_id === parcelle.id && String(p.rang) === rangStr);

      if (!placette) placette = placettes.find(p => p.parcelle_id === parcelle.id && String(p.numero) === String(col));

      const isNewPl = !placette;

      if (isNewPl) {

        s.placettesCreees++;

        placette = { _new: true, parcelle_id: parcelle.id, numero: col, rang: rangStr, nombre_emplacements: 50, emplacement_debut: debutNum, emplacement_fin: debutNum + 49 };

      } else {

        s.placettesReconnues++;

      }

      const nbEmp = isNewPl ? 50 : (placette.nombre_emplacements || 50);

      for (let i = 0; i < nbEmp; i++) {

        const rowIndex = matrixStart + i;

        if (rowIndex >= rows.length) break;

        const col0 = String(rows[rowIndex]?.[0] || "").trim();

        if (col0 !== "" && isNaN(Number(col0))) break;

        const rawVal = rows[rowIndex]?.[col];

        const empNumero = debutNum + i;

        let emp;

        if (!isNewPl) emp = emplacements.find(e => e.placette_id === placette.id && e.numero === empNumero);

        const isNewEmp = !emp;

        if (isNewEmp) {

          s.emplacementsNouveaux++;

          const stableId = `${parcelle.identifiant}-P${placette.numero}-E${empNumero}`;

          emp = { _new: true, identifiant_stable: stableId, parcelle_id: parcelle.id, numero: empNumero };

        } else {

          s.emplacementsReconnus++;

        }

        const valStr = String(rawVal ?? "").trim();

        const code = valStr === "" ? SAINE_CODE : valStr;

        if (!catCodes.has(code)) {

          s.valeursInconnues++;

          errors.push({ sheet: pSheet.name, row: rowIndex + 1, type: "valeur_inconnue", message: `Code inconnu: "${code}" (col ${col}, emp ${empNumero})` });

        }

        const dk = emp.identifiant_stable || `${parcelle.id}-${placette.id || placette.numero}-${empNumero}`;

        if (seen.has(dk)) {

          s.doublons++;

          errors.push({ sheet: pSheet.name, row: rowIndex + 1, type: "doublon", message: `Doublon: ${dk}` });

          continue;

        }

        seen.add(dk);

        if (emp.id && existingKeys.has(emp.id)) {

          errors.push({ sheet: pSheet.name, row: rowIndex + 1, type: "existant", message: `Notation ${YEAR_IMPORT} déjà existante pour ${dk}` });

          continue;

        }

        s.notations++;

        toImport.push({ parcelle, placette, emplacement: emp, code, sheet: pSheet.name, row: rowIndex + 1 });

      }

    }

  }

  return {

    stats: {

      parcellesReconnues: s.parcellesReconnues.size, parcellesInconnues: s.parcellesInconnues.size,

      placettesReconnues: s.placettesReconnues, placettesCreees: s.placettesCreees,

      emplacementsReconnus: s.emplacementsReconnus, emplacementsNouveaux: s.emplacementsNouveaux,

      notations: s.notations, valeursInconnues: s.valeursInconnues, doublons: s.doublons, donneesManquantes: s.donneesManquantes,

    },

    errors, toImport, unknownParcelles: [...s.parcellesInconnues],

    sheetsDetected: allSheets.length, parcelleSheetsDetected: parcelleSheets.length,

  };

}

async function batchCreate(entity, records, size = 400) {

  const out = [];

  for (let i = 0; i < records.length; i += size) out.push(...await entity.bulkCreate(records.slice(i, i + size)));

  return out;

}

export async function executeImport(analysis) {

  const user = await base44.auth.me();

  const { toImport } = analysis;

  const newPlMap = new Map();

  for (const item of toImport) {

    if (item.placette._new) {

      const key = `${item.placette.parcelle_id}-${item.placette.rang}`;

      if (!newPlMap.has(key)) newPlMap.set(key, { parcelle_id: item.placette.parcelle_id, numero: item.placette.numero, rang: item.placette.rang, nombre_emplacements: item.placette.nombre_emplacements, emplacement_debut: item.placette.emplacement_debut, emplacement_fin: item.placette.emplacement_fin });

    }

  }

  const createdPlacettes = newPlMap.size ? await batchCreate(base44.entities.Placette, [...newPlMap.values()]) : [];

  const placetteByRang = new Map(createdPlacettes.map(p => [`${p.parcelle_id}-${p.rang}`, p]));

  const newEmpMap = new Map();

  for (const item of toImport) {

    if (item.emplacement._new && !newEmpMap.has(item.emplacement.identifiant_stable)) {

      const plId = item.placette._new ? placetteByRang.get(`${item.placette.parcelle_id}-${item.placette.rang}`)?.id : item.placette.id;

      newEmpMap.set(item.emplacement.identifiant_stable, { parcelle_id: item.parcelle.id, placette_id: plId, numero: item.emplacement.numero, identifiant_stable: item.emplacement.identifiant_stable });

    }

  }

  const createdEmps = newEmpMap.size ? await batchCreate(base44.entities.Emplacement, [...newEmpMap.values()]) : [];

  const empByStable = new Map(createdEmps.map(e => [e.identifiant_stable, e]));

  const pids = [...new Set(toImport.map(i => i.parcelle.id))];

  const pros = {};

  for (const pid of pids) {

    let p = (await base44.entities.Prospection.filter({ parcelle_id: pid, annee: YEAR_IMPORT }))[0];

    if (!p) p = await base44.entities.Prospection.create({ parcelle_id: pid, annee: YEAR_IMPORT, statut: "terminee", date_debut: new Date().toISOString(), date_fin: new Date().toISOString(), utilisateur_id: user.id, utilisateur_nom: user.full_name });

    pros[pid] = p;

  }

  const notations = toImport.map(i => {

    const plId = i.placette._new ? placetteByRang.get(`${i.placette.parcelle_id}-${i.placette.rang}`)?.id : i.placette.id;

    const empId = i.emplacement.id || empByStable.get(i.emplacement.identifiant_stable)?.id;

    return { prospection_id: pros[i.parcelle.id].id, parcelle_id: i.parcelle.id, placette_id: plId, emplacement_id: empId, numero_emplacement: i.emplacement.numero, rang: i.placette.rang, annee: YEAR_IMPORT, code: i.code, utilisateur_id: user.id, utilisateur_nom: user.full_name, date_saisie: new Date().toISOString(), hors_ligne: false };

  });

  const created = await batchCreate(base44.entities.Notation, notations);

  return { notations: created.length, emplacementsCreated: createdEmps.length, placettesCreated: createdPlacettes.length };

}
