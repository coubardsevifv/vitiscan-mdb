import { useEffect, useMemo, useState } from "react";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import L from "leaflet";

import { Link } from "react-router-dom";

import { Parcelle, Placette, Notation, Prospection } from "@/api/entities";

import { cepageColor } from "@/lib/cepageColors";

import { computeParcelleStatus } from "@/lib/parcelleStatus";

import { parcelleTitle } from "@/lib/parcelleLabel";

import StatusBadge from "@/components/StatusBadge";

import "leaflet/dist/leaflet.css";

const YEAR = new Date().getFullYear();

// Punaise "goutte d'eau inversée" (même tracé que l'icône MapPin de
// lucide-react utilisée ailleurs dans l'app), colorée par cépage. Les
// parcelles déjà prospectées sont grisées et semi-transparentes.
function pinIcon(color, muted) {
  const html = `<svg width="30" height="30" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
      style="${muted ? "opacity:.45;filter:grayscale(75%);" : "filter:drop-shadow(0 1px 2px rgba(0,0,0,.35));"}">
    <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
          fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="3" fill="white"/>
  </svg>`;
  return L.divIcon({ html, className: "", iconSize: [30, 30], iconAnchor: [15, 28], popupAnchor: [0, -26] });
}

const STATUT_OPTIONS = [
  ["", "Tous les statuts"],
  ["a_faire", "À faire"],
  ["en_cours", "En cours"],
  ["terminee", "Prospectées"],
];

export default function Carte() {
  const [rows, setRows] = useState([]);
  const [placettes, setPlacettes] = useState([]);
  const [notations, setNotations] = useState([]);
  const [prospections, setProspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCepage, setFilterCepage] = useState("");
  const [filterOrganisme, setFilterOrganisme] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  useEffect(() => {
    Promise.all([
      Parcelle.filter({ active: true }),
      Placette.list(),
      Notation.filter({ annee: YEAR }),
      Prospection.filter({ annee: YEAR }),
    ]).then(([p, pl, n, pr]) => {
      setRows(p);
      setPlacettes(pl);
      setNotations(n);
      setProspections(pr);
      setLoading(false);
    });
  }, []);

  const cepages = useMemo(() => [...new Set(rows.map((p) => p.cepage).filter(Boolean))].sort(), [rows]);
  const organismes = useMemo(() => [...new Set(rows.map((p) => p.organisme).filter(Boolean))].sort(), [rows]);

  const withStatus = useMemo(
    () =>
      rows
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          ...p,
          status: computeParcelleStatus(p.id, {
            placettes,
            notations,
            prospection: prospections.find((pr) => pr.parcelle_id === p.id),
          }),
        })),
    [rows, placettes, notations, prospections]
  );

  const filtered = withStatus.filter(
    (p) =>
      (!filterCepage || p.cepage === filterCepage) &&
      (!filterOrganisme || p.organisme === filterOrganisme) &&
      (!filterStatut || p.status === filterStatut)
  );

  return (
    <section>
      <div className="mb-5">
        <p className="text-sm font-semibold text-emerald-700">Observatoire</p>
        <h1 className="text-2xl font-black">Carte des parcelles</h1>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <select value={filterCepage} onChange={(e) => setFilterCepage(e.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm">
          <option value="">Tous les cépages</option>
          {cepages.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterOrganisme} onChange={(e) => setFilterOrganisme(e.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm">
          <option value="">Tous les organismes</option>
          {organismes.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="h-10 rounded-lg border bg-white px-3 text-sm">
          {STATUT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {cepages.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {cepages.map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: cepageColor(c) }} />
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="h-[calc(100vh-260px)] min-h-96 overflow-hidden rounded-2xl border bg-white shadow-sm">
        {loading ? (
          <div className="grid h-full place-items-center text-slate-400">Chargement…</div>
        ) : filtered.length ? (
          <MapContainer center={[48.4, 7.45]} zoom={9} className="h-full w-full">
            <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filtered.map((p) => (
              <Marker key={p.id} position={[p.latitude, p.longitude]} icon={pinIcon(cepageColor(p.cepage), p.status === "terminee")}>
                <Popup>
                  <div className="min-w-48">
                    <b>{parcelleTitle(p)}</b>
                    <p>{p.commune} · {p.cepage}</p>
                    {p.organisme && <p className="text-xs text-slate-500">{p.organisme}</p>}
                    <p className="mt-2"><StatusBadge status={p.status} /></p>
                    <div className="mt-2 flex gap-2">
                      <Link className="font-bold text-emerald-700" to={`/parcelles/${p.id}`}>Prospecter</Link>
                      <a className="font-bold text-blue-700" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}>Itinéraire</a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="grid h-full place-items-center p-8 text-center text-slate-500">Aucune parcelle ne correspond aux filtres.</div>
        )}
      </div>
    </section>
  );
}
