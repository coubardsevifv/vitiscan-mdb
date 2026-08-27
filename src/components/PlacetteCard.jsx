import { Link } from "react-router-dom";

import { ChevronRight } from "lucide-react";

import StatusBadge from "@/components/StatusBadge";

export default function PlacetteCard({placette,done,total}){const status=done===0?"a_faire":done>=total?"terminee":"en_cours";return <Link to={`/saisie/${placette.parcelle_id}/${placette.id}`} className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm active:scale-[.99]">

  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-800 font-bold text-white">{placette.numero}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between"><h3 className="font-bold">Placette {placette.numero}</h3><StatusBadge status={status}/></div><p className="mt-1 text-sm text-slate-500">Rang {placette.rang} · {placette.emplacement_debut}–{placette.emplacement_fin}</p><p className="mt-1 text-xs font-medium text-emerald-700">{done} / {total} emplacements</p></div><ChevronRight className="h-5 w-5 text-slate-400"/>

</Link>}
