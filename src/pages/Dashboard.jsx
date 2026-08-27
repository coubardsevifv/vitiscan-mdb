import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { base44 } from "@/api/base44Client";

import { MapPin, Layers, Grid3x3, FileSpreadsheet, Upload, Download } from "lucide-react";

function StatCard({ icon: Icon, label, value, tone }) {

  const tones = { emerald: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700" };

  return (

    <div className="rounded-xl border bg-white p-5">

      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></div>

      <p className="text-2xl font-black text-slate-900">{value}</p>

      <p className="text-sm text-slate-500">{label}</p>

    </div>

  );

}

export default function AdminDashboard() {

  const [stats, setStats] = useState(null);

  useEffect(() => {

    (async () => {

      const [parcelles, placettes, emplacements, n2025, n2026] = await Promise.all([

        base44.entities.Parcelle.list(), base44.entities.Placette.list(), base44.entities.Emplacement.list(),

        base44.entities.Notation.filter({ annee: 2025 }), base44.entities.Notation.filter({ annee: 2026 }),

      ]);

      setStats({ parcelles: parcelles.length, placettes: placettes.length, emplacements: emplacements.length, n2025: n2025.length, n2026: n2026.length });

    })();

  }, []);

  if (!stats) return <p className="text-slate-400">Chargement…</p>;

  return (

    <div>

      <h1 className="text-2xl font-black text-slate-900 mb-1">Tableau de bord</h1>

      <p className="text-slate-500 mb-8">Observatoire des Maladies du Bois — Alsace</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 mb-8">

        <StatCard icon={MapPin} label="Parcelles" value={stats.parcelles} tone="emerald" />

        <StatCard icon={Layers} label="Placettes" value={stats.placettes} tone="emerald" />

        <StatCard icon={Grid3x3} label="Emplacements" value={stats.emplacements} tone="emerald" />

        <StatCard icon={FileSpreadsheet} label="Notations 2025 (N-1)" value={stats.n2025} tone="amber" />

        <StatCard icon={FileSpreadsheet} label="Notations 2026" value={stats.n2026} tone="blue" />

      </div>

      <h2 className="mb-3 font-bold text-slate-900">Actions rapides</h2>

      <div className="grid gap-4 sm:grid-cols-2">

        <Link to="/admin/import" className="flex items-center gap-4 rounded-xl border bg-white p-5 transition hover:border-emerald-400">

          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Upload className="h-5 w-5" /></div>

          <div><p className="font-bold text-slate-900">Import Excel 2025</p><p className="text-sm text-slate-500">Importer les données historiques N-1</p></div>

        </Link>

        <Link to="/admin/export" className="flex items-center gap-4 rounded-xl border bg-white p-5 transition hover:border-blue-400">

          <div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-100 text-blue-700"><Download className="h-5 w-5" /></div>

          <div><p className="font-bold text-slate-900">Export des notations</p><p className="text-sm text-slate-500">Exporter en CSV (compatible Excel)</p></div>

        </Link>

      </div>

    </div>

  );

}
