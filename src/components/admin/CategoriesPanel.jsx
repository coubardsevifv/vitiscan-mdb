import { useEffect, useRef, useState } from "react";
import { CategorieNotation } from "@/api/entities";
import { importCategoriesFile } from "@/lib/categoriesImport";

export default function CategoriesPanel() {
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const load = () => CategorieNotation.list("ordre").then(setRows);
  useEffect(load, []);

  const add = async () => {
    const code = prompt("Code de la catégorie");
    if (code) {
      await CategorieNotation.create({ code, libelle: code, couleur: "#166534", ordre: rows.length + 1, active: true });
      load();
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const existing = new Set(rows.map((r) => r.code));
      setImportResult(await importCategoriesFile(file, existing));
      load();
    } catch (err) {
      setImportResult({ created: [], skipped: [], error: err.message || "Échec de l'import" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Catégories de notation</h2>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="rounded-lg border border-emerald-800 px-3 py-2 text-sm font-bold text-emerald-800 disabled:opacity-50"
          >
            {importing ? "Import…" : "Importer un fichier"}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button onClick={add} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white">Ajouter</button>
        </div>
      </div>

      {importResult && (
        <div className="mb-4 rounded-xl border bg-white p-4 text-sm">
          {importResult.error ? (
            <p className="text-red-700">{importResult.error}</p>
          ) : (
            <>
              <p className="font-bold text-emerald-800">{importResult.created.length} catégorie(s) créée(s)</p>
              {importResult.skipped.length > 0 && (
                <div className="mt-2 text-slate-600">
                  <p className="font-semibold">{importResult.skipped.length} ligne(s) ignorée(s) :</p>
                  <ul className="mt-1 list-disc pl-5">
                    {importResult.skipped.map((s, i) => (
                      <li key={i}>Ligne {s.row} ({s.identifiant || "?"}) — {s.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        {rows.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border p-3">
            <input type="color" value={c.couleur} onChange={(e) => CategorieNotation.update(c.id, { couleur: e.target.value }).then(load)} className="h-9 w-9" />
            <div className="flex-1">
              <b>{c.code}</b>
              <p className="text-xs text-slate-500">{c.libelle}</p>
            </div>
            <button onClick={() => CategorieNotation.update(c.id, { active: !c.active }).then(load)} className="text-xs font-semibold text-slate-500">{c.active ? "Actif" : "Inactif"}</button>
          </div>
        ))}
      </div>
      {!rows.length && <p className="py-8 text-center text-slate-500">Aucune catégorie. Ajoutez-en une ou importez un fichier.</p>}
    </div>
  );
}
