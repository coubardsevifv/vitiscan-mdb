import { useEffect, useState } from "react";

import { Search } from "lucide-react";

import { Parcelle, Placette, Notation, Prospection as ProspectionEntity } from "@/api/entities";

import { computeParcelleStatus } from "@/lib/parcelleStatus";

import { useAuth } from "@/lib/AuthContext";

import ParcelleCard from "@/components/ParcelleCard";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

const YEAR = new Date().getFullYear();

export default function Prospection() {
  const { user } = useAuth();
  const [parcelles, setParcelles] = useState([]);
  const [placettes, setPlacettes] = useState([]);
  const [notations, setNotations] = useState([]);
  const [prospections, setProspections] = useState([]);
  const [query, setQuery] = useState("");
  const [marking, setMarking] = useState(null);
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [markError, setMarkError] = useState("");

  const load = () =>
    Promise.all([
      Parcelle.filter({ active: true }, "identifiant"),
      Placette.list(),
      Notation.filter({ annee: YEAR }),
      ProspectionEntity.filter({ annee: YEAR }),
    ]).then(([p, pl, n, pr]) => {
      setParcelles(p);
      setPlacettes(pl);
      setNotations(n);
      setProspections(pr);
    });

  useEffect(() => { load(); }, []);

  const rows = parcelles.map((p) => {
    const ps = placettes.filter((x) => x.parcelle_id === p.id);
    const finished = ps.filter((x) => notations.filter((n) => n.placette_id === x.id).length >= x.nombre_emplacements).length;
    const prospection = prospections.find((pr) => pr.parcelle_id === p.id);
    return { p, finished, total: ps.length, status: computeParcelleStatus(p.id, { placettes, notations, prospection }) };
  });

  const filtered = rows.filter(({ p }) => `${p.identifiant} ${p.nom} ${p.commune} ${p.cepage}`.toLowerCase().includes(query.toLowerCase()));

  const openMark = (p) => {
    setMarking(p);
    setDate(new Date().toISOString().slice(0, 10));
    setMarkError("");
  };

  const confirmMark = async () => {
    if (!marking || !date) return;
    setSaving(true);
    setMarkError("");
    try {
      const existing = prospections.find((pr) => pr.parcelle_id === marking.id);
      if (existing) {
        await ProspectionEntity.update(existing.id, { statut: "terminee", date_fin: date });
      } else {
        await ProspectionEntity.create({
          parcelle_id: marking.id,
          annee: YEAR,
          statut: "terminee",
          date_debut: date,
          date_fin: date,
          utilisateur_id: user?.id,
          utilisateur_nom: user?.full_name,
        });
      }
      setMarking(null);
      load();
    } catch (err) {
      setMarkError(err.message || "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="mb-5">
        <p className="text-sm font-semibold text-emerald-700">Saisie terrain</p>
        <h1 className="text-2xl font-black text-slate-900">Choisir une parcelle</h1>
      </div>
      <div className="relative mb-5">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une parcelle…"
          className="h-12 w-full rounded-xl border bg-white pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-700"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((r) => (
          <ParcelleCard key={r.p.id} parcelle={r.p} status={r.status} progress={`${r.finished} / ${r.total}`} onMarkProspected={() => openMark(r.p)} />
        ))}
      </div>
      {!filtered.length && <p className="rounded-2xl border border-dashed p-8 text-center text-slate-500">Aucune parcelle disponible.</p>}

      <Dialog open={!!marking} onOpenChange={(open) => !open && setMarking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer "{marking?.nom}" comme prospectée</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">À utiliser quand la prospection a été faite sur papier plutôt que dans l'app.</p>
          {markError && <p className="text-sm text-red-600">{markError}</p>}
          <div className="space-y-2">
            <Label htmlFor="date-prospection">Date de prospection</Label>
            <Input id="date-prospection" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarking(null)}>Annuler</Button>
            <Button onClick={confirmMark} disabled={saving || !date}>{saving ? "Enregistrement…" : "Confirmer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
