import { useEffect, useState } from "react";

import { Search } from "lucide-react";

import { base44 } from "@/api/base44Client";

import ParcelleCard from "@/components/ParcelleCard";

export default function Prospection(){const [rows,setRows]=useState([]),[query,setQuery]=useState("");useEffect(()=>{(async()=>{const [parcelles,placettes,notations]=await Promise.all([base44.entities.Parcelle.filter({active:true},"identifiant"),base44.entities.Placette.list(),base44.entities.Notation.filter({annee:new Date().getFullYear()})]);setRows(parcelles.map(p=>{const ps=placettes.filter(x=>x.parcelle_id===p.id),finished=ps.filter(x=>notations.filter(n=>n.placette_id===x.id).length>=x.nombre_emplacements).length;return{p,finished,total:ps.length,status:finished===0?"a_faire":finished===ps.length&&ps.length?"terminee":"en_cours"}}))})()},[]);const filtered=rows.filter(({p})=>`${p.identifiant} ${p.nom} ${p.commune} ${p.cepage}`.toLowerCase().includes(query.toLowerCase()));return <section><div className="mb-5"><p className="text-sm font-semibold text-emerald-700">Saisie terrain</p><h1 className="text-2xl font-black text-slate-900">Choisir une parcelle</h1></div><div className="relative mb-5"><Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une parcelle…" className="h-12 w-full rounded-xl border bg-white pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-700"/></div><div className="grid gap-3 md:grid-cols-2">{filtered.map(r=><ParcelleCard key={r.p.id} parcelle={r.p} status={r.status} progress={`${r.finished} / ${r.total}`}/>)}</div>{!filtered.length&&<p className="rounded-2xl border border-dashed p-8 text-center text-slate-500">Aucune parcelle disponible.</p>}</section>}
