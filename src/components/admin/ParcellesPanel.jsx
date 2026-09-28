import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { Parcelle } from "@/api/entities";
import { supabase } from "@/api/base44Client";
import { importParcellesFile } from "@/lib/parcellesImport";
import { importPlacettesFile } from "@/lib/placettesImport";
import { parcelleTitle } from "@/lib/parcelleLabel";
import ParcelleForm from "@/components/admin/ParcelleForm";

function ImportResultSummary({ result, countLabel }) {
  if (result.error) return <p className="text-red-700">{result.error}</p>;
  return (
    <>
      <p className="font-bold text-emerald-800">{countLabel(result.created.length)}</p>
      {result.skipped.length > 0 && (
        <div className="mt-2 text-slate-600">
          <p className="font-semibold">{result.skipped.length} ligne(s) ignorée(s) :</p>
          <ul className="mt-1 list-disc pl-5">
            {result.skipped.map((s, i) => (
              <li key={i}>Ligne {s.row} ({s.identifiant || s.parcelle || "?"}) — {s.reason}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ParcelleEditPanel({ parcelle, onSaved }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const saveSens = async (value) => {
    await Parcelle.update(parcelle.id, { sens_comptage: value || null });
    onSaved();
  };

  const uploadPlan = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${parcelle.id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("parcelle-plans").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("parcelle-plans").getPublicUrl(path);
      await Parcelle.update(parcelle.id, { plan_image_url: data.publicUrl });
      onSaved();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-t bg-slate-50 p-3 text-sm">
      <label className="flex items-center gap-2 font-semibold">
        Sens de comptage des rangs :
        <select
          defaultValue={parcelle.sens_comptage || ""}
          onChange={(e) => saveSens(e.target.value)}
          className="h-9 rounded-lg border px-2 font-normal"
        >
          <option value="">Non renseigné</option>
          <option value="gauche_droite">Gauche → Droite</option>
          <option value="droite_gauche">Droite → Gauche</option>
        </select>
      </label>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="rounded-lg border border-emerald-800 px-3 py-2 font-bold text-emerald-800 disabled:opacity-50"
      >
        {uploading ? "Envoi…" : parcelle.plan_image_url ? "Remplacer le plan" : "Ajouter un plan (image)"}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPlan} />
      {parcelle.plan_image_url && (
        <a href={parcelle.plan_image_url} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 underline">
          Voir le plan actuel
        </a>
      )}
    </div>
  );
}

export default function ParcellesPanel() {
  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [importing, setImporting] = useState(null); // "parcelles" | "placettes" | null
  const [parcellesResult, setParcellesResult] = useState(null);
  const [placettesResult, setPlacettesResult] = useState(null);
  const parcellesInputRef = useRef(null);
  const placettesInputRef = useRef(null);

  const load = () => Parcelle.list("identifiant").then(setRows);
  useEffect(load, []);

  const toggle = async (p) => {
    await Parcelle.update(p.id, { active: !p.active });
    load();
  };

  const handleImportParcelles = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImporting("parcelles");
    setParcellesResult(null);
    try {
      const existing = new Set(rows.map((r) => r.identifiant));
      setParcellesResult(await importParcellesFile(file, existing));
      load();
    } catch (err) {
      setParcellesResult({ created: [], skipped: [], error: err.message || "Échec de l'import" });
    } finally {
      setImporting(null);
    }
  };

  const handleImportPlacettes = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setImporting("placettes");
    setPlacettesResult(null);
    try {
      setPlacettesResult(await importPlacettesFile(file));
    } catch (err) {
      setPlacettesResult({ created: [], skipped: [], error: err.message || "Échec de l'import" });
    } finally {
      setImporting(null);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Parcelles ({rows.length})</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => parcellesInputRef.current?.click()}
            disabled={!!importing}
            className="rounded-lg border border-emerald-800 px-3 py-2 text-sm font-bold text-emerald-800 disabled:opacity-50"
          >
            {importing === "parcelles" ? "Import…" : "Importer les parcelles"}
          </button>
          <input ref={parcellesInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportParcelles} />
          <button
            onClick={() => placettesInputRef.current?.click()}
            disabled={!!importing}
            className="rounded-lg border border-emerald-800 px-3 py-2 text-sm font-bold text-emerald-800 disabled:opacity-50"
          >
            {importing === "placettes" ? "Import…" : "Importer les placettes"}
          </button>
          <input ref={placettesInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportPlacettes} />
          <button onClick={() => setShow(!show)} className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-bold text-white">
            {show ? "Fermer" : "Créer une parcelle"}
          </button>
        </div>
      </div>

      {parcellesResult && (
        <div className="mb-4 rounded-xl border bg-white p-4 text-sm">
          <ImportResultSummary result={parcellesResult} countLabel={(n) => `${n} parcelle(s) créée(s)`} />
        </div>
      )}
      {placettesResult && (
        <div className="mb-4 rounded-xl border bg-white p-4 text-sm">
          <ImportResultSummary result={placettesResult} countLabel={(n) => `${n} placette(s) créée(s) (avec leurs emplacements)`} />
        </div>
      )}

      {show && (
        <div className="mb-6 border-b pb-6">
          <ParcelleForm onCreated={() => { setShow(false); load(); }} />
        </div>
      )}

      <div className="divide-y rounded-xl border">
        {rows.map((p) => (
          <div key={p.id}>
            <div className="flex items-center gap-3 p-3">
              <div className="flex-1">
                <b>{parcelleTitle(p)}</b>
                <p className="text-sm text-slate-500">{p.commune} · {p.cepage}{p.organisme ? ` · ${p.organisme}` : ""}</p>
              </div>
              <button
                onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Sens de comptage / plan"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggle(p)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${p.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
              >
                {p.active ? "Active" : "Désactivée"}
              </button>
            </div>
            {editingId === p.id && <ParcelleEditPanel parcelle={p} onSaved={load} />}
          </div>
        ))}
      </div>

      {!rows.length && !show && <p className="py-8 text-center text-slate-500">Aucune parcelle. Créez la première ou importez un fichier.</p>}
    </div>
  );
}
