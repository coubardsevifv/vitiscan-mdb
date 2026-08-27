import { Link } from "react-router-dom";

import { ChevronRight, MapPin } from "lucide-react";

import StatusBadge from "@/components/StatusBadge";

export default function ParcelleCard({parcelle,status="a_faire",progress="0 / 0"}){return <Link to={`/parcelles/${parcelle.id}`} className="block rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm transition active:scale-[.99]">

  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{parcelle.identifiant}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{parcelle.nom}</h2><p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5"/>{parcelle.commune} · {parcelle.cepage}</p></div><ChevronRight className="mt-2 h-5 w-5 text-slate-400"/></div>

  <div className="mt-4 flex items-center justify-between"><StatusBadge status={status}/><span className="text-xs font-medium text-slate-500">{progress} placettes</span></div>

</Link>}
