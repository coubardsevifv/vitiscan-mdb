import { useEffect, useState } from "react";

import { ArrowLeft, MapPin } from "lucide-react";

import { Link, useParams } from "react-router-dom";

import { base44 } from "@/api/base44Client";

import PlacetteCard from "@/components/PlacetteCard";

export default function ParcelleDetail(){const {id}=useParams(),[state,setState]=useState(null);useEffect(()=>{(async()=>{const [parcelle,placettes,notations]=await Promise.all([base44.entities.Parcelle.get(id),base44.entities.Placette.filter({parcelle_id:id},"numero"),base44.entities.Notation.filter({parcelle_id:id,annee:new Date().getFullYear()})]);setState({parcelle,placettes,notations})})()},[id]);if(!state)return <p className="p-8 text-center">Chargement…</p>;return <section><Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft className="h-4 w-4"/>Parcelles</Link><div className="mb-5 rounded-2xl bg-emerald-900 p-5 text-white"><p className="text-xs font-bold uppercase tracking-wider text-emerald-200">{state.parcelle.identifiant}</p><h1 className="mt-1 text-2xl font-black">{state.parcelle.nom}</h1><p className="mt-2 flex items-center gap-1 text-sm text-emerald-100"><MapPin className="h-4 w-4"/>{state.parcelle.commune} · {state.parcelle.cepage}</p></div><h2 className="mb-3 font-bold">Placettes ({state.placettes.length})</h2><div className="space-y-3">{state.placettes.map(p=><PlacetteCard key={p.id} placette={p} done={state.notations.filter(n=>n.placette_id===p.id).length} total={p.nombre_emplacements}/>)}</div></section>}
