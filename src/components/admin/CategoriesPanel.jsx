import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
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

  const updateField = (c, field, value) => {
    if (value === "" || value === c[field]) return;
    CategorieNotation.update(c.id, { [field]: value }).then(load);
  };

  const remove = async (c) => {
    if (!window.confirm(`Supprimer la catégorie "${c.code}" ? Les notations déjà saisies avec ce code resteront inchangées, mais n'afficheront plus de couleur ni de libellé.`)) return;
    await CategorieNotation.delete(c.id);
    load();
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

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <th className="p-3">Couleur</th>
              <th className="p-3">Code</th>
              <th className="p-3">Libellé</th>
              <th className="p-3">Ordre</th>
              <th className="p-3">Statut</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-2">
                  <input
                    type="color"
                    value={c.couleur}
                    onChange={(e) => updateField(c, "couleur", e.target.value)}
                    className="h-9 w-9 cursor-pointer"
                  />
                </td>
                <td className="p-2">
                  <input
                    defaultValue={c.code}
                    onBlur={(e) => updateField(c, "code", e.target.value.trim())}
                    className="h-9 w-28 rounded-lg border px-2 font-bold"
                  />
                </td>
                <td className="p-2">
                  <input
                    defaultValue={c.libelle}
                    onBlur={(e) => updateField(c, "libelle", e.target.value.trim())}
                    className="h-9 w-full min-w-40 rounded-lg border px-2"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    defaultValue={c.ordre}
                    onBlur={(e) => updateField(c, "ordre", Number(e.target.value))}
                    className="h-9 w-16 rounded-lg border px-2"
                  />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => CategorieNotation.update(c.id, { active: !c.active }).then(load)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${c.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                  >
                    {c.active ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="p-2">
                  <button onClick={() => remove(c)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="py-8 text-center text-slate-500">Aucune catégorie. Ajoutez-en une ou importez un fichier.</p>}
    </div>
  );
}
