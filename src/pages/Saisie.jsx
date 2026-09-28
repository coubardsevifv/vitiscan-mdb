import { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Cloud, CloudOff, ArrowLeftRight } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NotationGrid from "@/components/NotationGrid";
import useSaisie from "@/hooks/useSaisie";
import { Placette } from "@/api/entities";
import { SENS_COMPTAGE_LABELS } from "@/lib/parcelleLabel";

export default function Saisie() {
  const { parcelleId, placetteId } = useParams();
  const navigate = useNavigate();
  const s = useSaisie(parcelleId, placetteId);
  const [siblingPlacettes, setSiblingPlacettes] = useState([]);

  useEffect(() => {
    Placette.filter({ parcelle_id: parcelleId }, "numero").then(setSiblingPlacettes);
  }, [parcelleId]);

  if (s.loading) return <div className="grid min-h-screen place-items-center">Chargement de la placette…</div>;

  const total = s.emplacements.length;
  const complete = s.notations.length >= total;
  const prevCat = s.categories.find((c) => c.code === s.previousNotation?.code);
  const prevLabel = s.previousNotation ? (prevCat ? `${s.previousNotation.code} – ${prevCat.libelle}` : s.previousNotation.code) : "Non renseignée";

  const currentSiblingIdx = siblingPlacettes.findIndex((p) => p.id === placetteId);
  const nextPlacette = currentSiblingIdx >= 0 ? siblingPlacettes[currentSiblingIdx + 1] : null;

  const jumpToIndex = () => {
    const input = prompt(`Aller à l'emplacement n° (1 à ${total})`, String(s.index + 1));
    if (input === null) return;
    const n = Number(input);
    if (Number.isFinite(n) && n >= 1 && n <= total) s.setIndex(n - 1);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f3] p-4 pb-8">
      {complete && <div className="pointer-events-none fixed inset-0 z-40 border-[10px] border-emerald-500" />}
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <Link to={`/parcelles/${parcelleId}`} className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow"><ArrowLeft /></Link>
          <div className="text-center">
            <p className="text-xs font-bold text-emerald-700">{s.parcelle.identifiant} · Placette {s.placette.numero}</p>
            <p className="font-black">Rang {s.placette.rang}</p>
          </div>
          <div className="grid h-11 w-11 place-items-center text-emerald-700">{navigator.onLine ? <Cloud /> : <CloudOff />}</div>
        </div>

        {SENS_COMPTAGE_LABELS[s.parcelle.sens_comptage] && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            Comptez les rangs de {SENS_COMPTAGE_LABELS[s.parcelle.sens_comptage]}, face à la parcelle
          </div>
        )}

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-emerald-700 transition-all" style={{ width: `${total ? ((s.index + 1) / total) * 100 : 0}%` }} />
        </div>

        {complete && (
          <div className="mb-4 rounded-xl bg-emerald-100 p-4 text-center">
            <p className="mb-3 font-bold text-emerald-800">Placette terminée ✓</p>
            <div className="flex gap-2">
              <Link
                to={`/parcelles/${parcelleId}`}
                className="flex-1 rounded-xl border border-emerald-700 bg-white py-2.5 text-center text-sm font-bold text-emerald-800"
              >
                Toutes les placettes
              </Link>
              {nextPlacette && (
                <button
                  onClick={() => navigate(`/saisie/${parcelleId}/${nextPlacette.id}`)}
                  className="flex-1 rounded-xl bg-emerald-800 py-2.5 text-sm font-bold text-white"
                >
                  Placette suivante →
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-5 rounded-3xl bg-white p-5 text-center shadow-sm">
          <button onClick={jumpToIndex} className="mx-auto block active:opacity-70">
            <span className="text-6xl font-black text-slate-900">{s.index + 1}</span>
            <span className="text-2xl font-bold text-slate-400">/{total}</span>
          </button>
          <p className="mt-1 text-xs text-slate-400">Touchez pour aller à un emplacement précis</p>
          <div className="mt-4 rounded-xl bg-slate-100 p-3">
            <p className="text-xs font-bold uppercase text-slate-500">Notation {s.year - 1} · lecture seule</p>
            <p className="mt-1 text-xl font-black">{prevLabel}</p>
          </div>
        </div>

        <NotationGrid categories={s.categories} value={s.currentNotation?.code} onSelect={s.save} disabled={s.saving} />

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => s.setIndex(Math.max(0, s.index - 1))}
            disabled={!s.index}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl border bg-white font-bold disabled:opacity-30"
          >
            <ChevronLeft />Précédent
          </button>
          <button
            onClick={() => s.setIndex(Math.min(total - 1, s.index + 1))}
            disabled={s.index >= total - 1}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white font-bold disabled:opacity-30"
          >
            Suivant<ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
