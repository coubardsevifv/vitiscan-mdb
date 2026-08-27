import { useEffect, useState } from "react";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

import { Link } from "react-router-dom";

import { base44 } from "@/api/base44Client";

import "leaflet/dist/leaflet.css";

export default function Carte(){const [rows,setRows]=useState([]);useEffect(()=>{base44.entities.Parcelle.filter({active:true}).then(setRows)},[]);const located=rows.filter(p=>p.latitude&&p.longitude);return <section><div className="mb-5"><p className="text-sm font-semibold text-emerald-700">Observatoire</p><h1 className="text-2xl font-black">Carte des parcelles</h1></div><div className="h-[calc(100vh-190px)] min-h-96 overflow-hidden rounded-2xl border bg-white shadow-sm">{located.length?<MapContainer center={[48.4,7.45]} zoom={9} className="h-full w-full"><TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{located.map(p=><CircleMarker key={p.id} center={[p.latitude,p.longitude]} radius={10} pathOptions={{color:"#065f46",fillColor:"#10b981",fillOpacity:.9}}><Popup><div className="min-w-48"><b>{p.identifiant} · {p.nom}</b><p>{p.commune} · {p.cepage}</p><p>{p.latitude}, {p.longitude}</p><div className="mt-2 flex gap-2"><Link className="font-bold text-emerald-700" to={`/parcelles/${p.id}`}>Prospecter</Link><a className="font-bold text-blue-700" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}>Itinéraire</a></div></div></Popup></CircleMarker>)}</MapContainer>:<div className="grid h-full place-items-center p-8 text-center text-slate-500">Ajoutez les coordonnées GPS des parcelles pour les afficher ici.</div>}</div></section>}
