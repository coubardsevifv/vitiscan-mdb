import { base44 } from "@/api/base44Client";

import { Download } from "lucide-react";

export default function AdminExport() {

  const exportCsv = async () => {

    const [n, p] = await Promise.all([base44.entities.Notation.list(), base44.entities.Parcelle.list()]);

    const lines = [["Année", "Parcelle", "Placette", "Rang", "Emplacement", "Notation", "Utilisateur", "Date"],

      ...n.map(x => [x.annee, p.find(y => y.id === x.parcelle_id)?.identifiant || "", x.placette_id, x.rang, x.numero_emplacement, x.code, x.utilisateur_nom, x.date_saisie])];

    const csv = lines.map(r => r.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");

    const a = document.createElement("a");

    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));

    a.download = `MDB-export-${new Date().toISOString().slice(0, 10)}.csv`;

    a.click();

  };

  return (

    <div>

      <h1 className="mb-6 text-2xl font-black text-slate-900">Export des données</h1>

      <div className="rounded-xl border bg-white p-6">

        <p className="mb-4 text-slate-600">Exportez toutes les notations de toutes les campagnes au format CSV (compatible Excel). Les codes de notation sont conservés en brut.</p>

        <button onClick={exportCsv} className="flex items-center gap-2 rounded-lg bg-emerald-800 px-6 py-3 font-bold text-white hover:bg-emerald-900"><Download className="h-5 w-5" />Exporter en CSV</button>

      </div>

    </div>

  );

}
