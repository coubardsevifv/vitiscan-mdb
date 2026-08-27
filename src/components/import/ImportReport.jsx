import { Download, AlertTriangle, CheckCircle2, Info } from "lucide-react";

function Stat({ label, value, tone }) {

  const tones = { ok: "bg-emerald-50 text-emerald-800", warn: "bg-amber-50 text-amber-800", err: "bg-red-50 text-red-800" };

  return <div className={`rounded-lg p-3 ${tones[tone]}`}><p className="text-2xl font-black">{value}</p><p className="text-xs font-semibold">{label}</p></div>;

}

export default function ImportReport({ analysis, onConfirm, onCancel }) {

  const { stats, errors, unknownParcelles, toImport } = analysis;

  const canImport = toImport.length > 0 && unknownParcelles.length === 0;

  const downloadErrors = () => {

    const csv = ["Onglet;Ligne;Type;Message", ...errors.map(e => `"${e.sheet}";${e.row};"${e.type}";"${e.message.replaceAll('"', '""')}"`)].join("\n");

    const a = document.createElement("a");

    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));

    a.download = "rapport-controle-import.csv";

    a.click();

  };

  return (

    <div>

      <div className="mb-4 flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">

        <Info className="h-5 w-5 shrink-0 text-blue-600" />

        <p className="text-sm text-blue-800">Les <b>cellules vides</b> de la matrice = <b>S (Sain)</b>. Les codes bruts sont conservés (y compris combinaisons comme "REC + T", "APO P").</p>

      </div>

      <h3 className="mb-3 font-bold text-slate-900">Rapport de contrôle</h3>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

        <Stat label="Parcelles reconnues" value={stats.parcellesReconnues} tone="ok" />

        <Stat label="Parcelles inconnues" value={stats.parcellesInconnues} tone="err" />

        <Stat label="Placettes reconnues" value={stats.placettesReconnues} tone="ok" />

        <Stat label="Placettes à créer" value={stats.placettesCreees} tone="warn" />

        <Stat label="Emplacements reconnus" value={stats.emplacementsReconnus} tone="ok" />

        <Stat label="Emplacements à créer" value={stats.emplacementsNouveaux} tone="warn" />

        <Stat label="Notations à importer" value={stats.notations} tone="ok" />

        <Stat label="Valeurs inconnues" value={stats.valeursInconnues} tone="err" />

        <Stat label="Doublons" value={stats.doublons} tone="err" />

      </div>

      {unknownParcelles.length > 0 && (

        <div className="mb-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">

          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />

          <div>

            <p className="font-bold text-amber-800">Parcelles inconnues ({unknownParcelles.length})</p>

            <p className="text-sm text-amber-700">{unknownParcelles.join(", ")}</p>

            <p className="mt-1 text-xs text-amber-600">Créez ces parcelles dans l'admin avant l'import.</p>

          </div>

        </div>

      )}

      {errors.length > 0 && (

        <div className="mb-5">

          <div className="mb-2 flex items-center justify-between">

            <h4 className="font-bold text-slate-900">Détail des alertes ({errors.length})</h4>

            <button onClick={downloadErrors} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-bold hover:bg-slate-50"><Download className="h-4 w-4" />Télécharger</button>

          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border">

            {errors.slice(0, 100).map((e, i) => (

              <div key={i} className="border-b p-2.5 text-sm">

                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{e.sheet}:L{e.row}</span>

                <span className="ml-2 text-slate-700">{e.message}</span>

              </div>

            ))}

            {errors.length > 100 && <div className="p-2 text-center text-sm text-slate-500">… et {errors.length - 100} autres</div>}

          </div>

        </div>

      )}

      {canImport && (

        <div className="mb-4 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">

          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />

          <p className="text-sm text-emerald-800">

            {stats.notations} notations seront importées en campagne 2025.

            {stats.placettesCreees > 0 && ` ${stats.placettesCreees} placettes et`}

            {stats.emplacementsNouveaux > 0 && ` ${stats.emplacementsNouveaux} emplacements seront créés.`}

            Aucune donnée existante ne sera écrasée.

          </p>

        </div>

      )}

      <div className="flex gap-3">

        <button onClick={onCancel} className="h-11 flex-1 rounded-lg border font-bold text-slate-700 hover:bg-slate-50">Annuler</button>

        <button onClick={onConfirm} disabled={!canImport} className="h-11 flex-1 rounded-lg bg-emerald-800 font-bold text-white disabled:opacity-50 hover:bg-emerald-900">

          {canImport ? `Valider l'import (${stats.notations})` : "Import bloqué"}

        </button>

      </div>

    </div>

  );

}
