import { Link } from "react-router-dom";

import { ChevronRight, MapPin } from "lucide-react";

import StatusBadge from "@/components/StatusBadge";

import { parcelleTitle } from "@/lib/parcelleLabel";

export default function ParcelleCard({ parcelle, status = "a_faire", progress = "0 / 0", onMarkProspected }) {
  return (
    <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-sm">
      <Link to={`/parcelles/${parcelle.id}`} className="block transition active:scale-[.99]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{parcelleTitle(parcelle)}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" />{parcelle.commune} · {parcelle.cepage}</p>
          </div>
          <ChevronRight className="mt-2 h-5 w-5 text-slate-400" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <StatusBadge status={status} />
          <span className="text-xs font-medium text-slate-500">{progress} placettes</span>
        </div>
      </Link>
      {onMarkProspected && (
        <button
          onClick={onMarkProspected}
          className="mt-3 w-full rounded-lg border border-dashed py-2 text-xs font-semibold text-slate-500 hover:border-emerald-400 hover:text-emerald-700"
        >
          Marquer comme prospectée (papier)
        </button>
      )}
    </div>
  );
}
