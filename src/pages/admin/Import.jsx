import { useState } from "react";

import { Link } from "react-router-dom";

import { useAuth } from "@/lib/AuthContext";

import { Upload, FileSpreadsheet, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

import { parseWorkbook, analyzeImport, executeImport, YEAR_IMPORT } from "@/lib/excelImport";

import ImportReport from "@/components/import/ImportReport";

export default function AdminImport() {

  const { user } = useAuth();

  const [step, setStep] = useState("upload");

  const [sheets, setSheets] = useState([]);

  const [analysis, setAnalysis] = useState(null);

  const [result, setResult] = useState(null);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  if (user?.role !== "admin") return <p className="text-slate-500">Accès refusé.</p>;

  const handleFile = async f => {

    if (!f) return;

    setError(""); setLoading(true); setStep("analyzing");

    try {

      const parsed = await parseWorkbook(f);

      setSheets(parsed);

      const res = await analyzeImport(parsed);

      setAnalysis(res);

      setStep("report");

    } catch (e) { setError(e.message); setStep("upload"); }

    finally { setLoading(false); }

  };

  const runImport = async () => {

    setLoading(true); setError(""); setStep("importing");

    try { setResult(await executeImport(analysis)); setStep("done"); }

    catch (e) { setError(e.message); setStep("report"); }

    finally { setLoading(false); }

  };

  const parcelleSheetCount = sheets.filter(s => s.isParcelle).length;

  return (

    <div className="max-w-3xl">

      <div className="mb-6">

        <Link to="/admin" className="mb-2 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Tableau de bord</Link>

        <h1 className="text-2xl font-black text-slate-900">Import Excel {YEAR_IMPORT}</h1>

        <p className="text-slate-500">Données historiques N-1 pour la campagne {YEAR_IMPORT + 1}</p>

      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {step === "upload" && (

        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">

          <FileSpreadsheet className="mx-auto mb-4 h-16 w-16 text-emerald-600" />

          <p className="mb-2 text-lg font-bold text-slate-900">Sélectionnez le fichier Excel {YEAR_IMPORT}</p>

          <p className="mx-auto mb-6 max-w-md text-sm text-slate-500">Format .xlsx. 1 onglet par parcelle. Les cellules vides = <b>S (Sain)</b>. Les codes bruts sont conservés (y compris combinaisons). Aucune donnée existante ne sera écrasée.</p>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-800 px-6 py-3 font-bold text-white hover:bg-emerald-900">

            <Upload className="h-5 w-5" /> Choisir un fichier

            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleFile(e.target.files[0])} />

          </label>

        </div>

      )}

      {(step === "analyzing" || step === "importing") && (

        <div className="grid place-items-center rounded-xl border bg-white p-12">

          <Loader2 className="mb-4 h-10 w-10 animate-spin text-emerald-700" />

          <p className="font-bold text-slate-900">{step === "importing" ? "Import en cours…" : "Analyse du fichier…"}</p>

        </div>

      )}

      {step === "report" && analysis && (

        <div className="rounded-xl border bg-white p-6">

          <div className="mb-4 text-sm text-slate-500">{analysis.sheetsDetected} onglets détectés — {analysis.parcelleSheetsDetected} onglets de parcelles identifiés</div>

          <ImportReport analysis={analysis} onConfirm={runImport} onCancel={() => setStep("upload")} />

        </div>

      )}

      {step === "done" && result && (

        <div className="rounded-xl border bg-white p-8 text-center">

          <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-emerald-600" />

          <h2 className="text-xl font-black text-slate-900">Import terminé</h2>

          <p className="mt-2 text-slate-600">{result.notations} notations importées pour la campagne {YEAR_IMPORT}.</p>

          {result.placettesCreated > 0 && <p className="text-sm text-slate-500">{result.placettesCreated} placettes créées.</p>}

          {result.emplacementsCreated > 0 && <p className="text-sm text-slate-500">{result.emplacementsCreated} emplacements créés.</p>}

          <div className="mt-6 flex justify-center gap-3">

            <Link to="/admin" className="rounded-lg border px-6 py-3 font-bold hover:bg-slate-50">Tableau de bord</Link>

            <Link to="/admin/export" className="rounded-lg bg-emerald-800 px-6 py-3 font-bold text-white hover:bg-emerald-900">Exporter</Link>

          </div>

        </div>

      )}

    </div>

  );

}
