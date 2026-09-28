import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, ArrowLeftRight, Image as ImageIcon, Pencil } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Parcelle, Placette, Notation } from "@/api/entities";
import { parcelleTitle, SENS_COMPTAGE_LABELS } from "@/lib/parcelleLabel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PlacetteCard from "@/components/PlacetteCard";

export default function ParcelleDetail() {
  const { id } = useParams();
  const [state, setState] = useState(null);
  const [showPlan, setShowPlan] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = () =>
    Promise.all([
      Parcelle.get(id),
      Placette.filter({ parcelle_id: id }, "numero"),
      Notation.filter({ parcelle_id: id, annee: new Date().getFullYear() }),
    ]).then(([parcelle, placettes, notations]) => setState({ parcelle, placettes, notations }));

  useEffect(() => { load(); }, [id]);

  const openNotes = () => {
    setNotesDraft(state.parcelle.informations || "");
    setEditingNotes(true);
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    await Parcelle.update(id, { informations: notesDraft, notes_updated_at: new Date().toISOString() });
    setSavingNotes(false);
    setEditingNotes(false);
    load();
  };

  if (!state) return <p className="p-8 text-center">Chargement…</p>;
  const { parcelle, placettes, notations } = state;

  return (
    <section>
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <ArrowLeft className="h-4 w-4" />Parcelles
      </Link>

      <div className="mb-5 rounded-2xl bg-emerald-900 p-5 text-white">
        <h1 className="text-2xl font-black">{parcelleTitle(parcelle)}</h1>
        <p className="mt-2 flex items-center gap-1 text-sm text-emerald-100">
          <MapPin className="h-4 w-4" />{parcelle.commune} · {parcelle.cepage}
        </p>
        {SENS_COMPTAGE_LABELS[parcelle.sens_comptage] && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-emerald-100">
            <ArrowLeftRight className="h-4 w-4 shrink-0" />Rangs comptés de {SENS_COMPTAGE_LABELS[parcelle.sens_comptage]}, face à la parcelle
          </p>
        )}
        {parcelle.plan_image_url && (
          <button
            onClick={() => setShowPlan(true)}
            className="mt-3 flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-bold hover:bg-white/25"
          >
            <ImageIcon className="h-4 w-4" />Voir le plan de la parcelle
          </button>
        )}
      </div>

      <div className="mb-5 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Notes</h2>
          <button onClick={openNotes} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
            <Pencil className="h-3.5 w-3.5" />Modifier
          </button>
        </div>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{parcelle.informations || "Aucune note pour cette parcelle."}</p>
        {parcelle.notes_updated_at && (
          <p className="mt-2 text-xs text-slate-400">
            Dernière mise à jour : {new Date(parcelle.notes_updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      <h2 className="mb-3 font-bold">Placettes ({placettes.length})</h2>
      <div className="space-y-3">
        {placettes.map((p) => (
          <PlacetteCard key={p.id} placette={p} done={notations.filter((n) => n.placette_id === p.id).length} total={p.nombre_emplacements} />
        ))}
      </div>

      <Dialog open={showPlan} onOpenChange={setShowPlan}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plan de {parcelle.nom}</DialogTitle>
          </DialogHeader>
          <img src={parcelle.plan_image_url} alt={`Plan de la parcelle ${parcelle.nom}`} className="w-full rounded-lg" />
        </DialogContent>
      </Dialog>

      <Dialog open={editingNotes} onOpenChange={setEditingNotes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes — {parcelle.nom}</DialogTitle>
          </DialogHeader>
          <Textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={6} placeholder="Repères, accès, particularités de la parcelle…" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNotes(false)}>Annuler</Button>
            <Button onClick={saveNotes} disabled={savingNotes}>{savingNotes ? "Enregistrement…" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
