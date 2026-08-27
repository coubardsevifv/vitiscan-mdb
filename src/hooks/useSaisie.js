import { useEffect, useMemo, useState } from "react";

import { base44 } from "@/api/base44Client";

const YEAR=new Date().getFullYear(), KEY="mdb_pending_notations", CACHE="mdb_field_cache";

const pending=()=>JSON.parse(localStorage.getItem(KEY)||"[]");

const store=(rows)=>localStorage.setItem(KEY,JSON.stringify(rows));

export default function useSaisie(parcelleId,placetteId){

 const [data,setData]=useState({loading:true,parcelle:null,placette:null,emplacements:[],categories:[],notations:[],previous:[]});

 const [index,setIndex]=useState(0); const [saving,setSaving]=useState(false);

 useEffect(()=>{(async()=>{let fresh;try{const [parcelle,placette,emplacements,categories,notations,previous]=await Promise.all([base44.entities.Parcelle.get(parcelleId),base44.entities.Placette.get(placetteId),base44.entities.Emplacement.filter({placette_id:placetteId},"numero"),base44.entities.CategorieNotation.filter({active:true},"ordre"),base44.entities.Notation.filter({placette_id:placetteId,annee:YEAR}),base44.entities.Notation.filter({placette_id:placetteId,annee:YEAR-1})]);fresh={parcelle,placette,emplacements,categories,notations,previous};localStorage.setItem(`${CACHE}-${placetteId}`,JSON.stringify(fresh));}catch{fresh=JSON.parse(localStorage.getItem(`${CACHE}-${placetteId}`)||"null");if(!fresh)return;}const local=pending().filter(x=>x.payload.placette_id===placetteId).map(x=>x.payload);const merged=[...fresh.notations];local.forEach(n=>{const i=merged.findIndex(x=>x.emplacement_id===n.emplacement_id);i<0?merged.push(n):merged[i]=n});const first=fresh.emplacements.findIndex(e=>!merged.some(n=>n.emplacement_id===e.id));setIndex(first<0?0:first);setData({loading:false,...fresh,notations:merged});})();},[parcelleId,placetteId]);

 useEffect(()=>{const sync=async()=>{if(!navigator.onLine)return;for(const item of pending()){try{let payload=item.payload;if(payload.prospection_id.startsWith("offline-")){let pros=(await base44.entities.Prospection.filter({parcelle_id:payload.parcelle_id,annee:YEAR}))[0];if(!pros)pros=await base44.entities.Prospection.create({parcelle_id:payload.parcelle_id,annee:YEAR,statut:"en_cours",date_debut:new Date().toISOString(),utilisateur_id:payload.utilisateur_id,utilisateur_nom:payload.utilisateur_nom});payload={...payload,prospection_id:pros.id,hors_ligne:false};}const saved=item.id?await base44.entities.Notation.update(item.id,payload):await base44.entities.Notation.create(payload);store(pending().filter(x=>x.key!==item.key));setData(d=>({...d,notations:d.notations.map(n=>n.emplacement_id===saved.emplacement_id?saved:n)}));}catch{break}}};window.addEventListener("online",sync);sync();return()=>window.removeEventListener("online",sync)},[]);

 const current=data.emplacements[index]; const currentNotation=data.notations.find(n=>n.emplacement_id===current?.id); const previous=data.previous.find(n=>n.emplacement_id===current?.id);

 const save=async(code)=>{if(!current)return;setSaving(true);const user=await base44.auth.me();let pros=(await base44.entities.Prospection.filter({parcelle_id:parcelleId,annee:YEAR}))[0];if(!pros&&navigator.onLine)pros=await base44.entities.Prospection.create({parcelle_id:parcelleId,annee:YEAR,statut:"en_cours",date_debut:new Date().toISOString(),utilisateur_id:user.id,utilisateur_nom:user.full_name});const payload={prospection_id:pros?.id||`offline-${parcelleId}-${YEAR}`,parcelle_id:parcelleId,placette_id:placetteId,emplacement_id:current.id,numero_emplacement:current.numero,rang:data.placette.rang,annee:YEAR,code,utilisateur_id:user.id,utilisateur_nom:user.full_name,date_saisie:new Date().toISOString(),hors_ligne:!navigator.onLine};const key=`${YEAR}-${current.id}`,queue=pending().filter(x=>x.key!==key);store([...queue,{key,id:currentNotation?.id,payload}]);setData(d=>({...d,notations:[...d.notations.filter(n=>n.emplacement_id!==current.id),payload]}));if(navigator.onLine){try{const saved=currentNotation?.id?await base44.entities.Notation.update(currentNotation.id,payload):await base44.entities.Notation.create(payload);store(pending().filter(x=>x.key!==key));setData(d=>({...d,notations:d.notations.map(n=>n.emplacement_id===current.id?saved:n)}));}catch{}}

 setSaving(false);if(index<data.emplacements.length-1)setIndex(index+1)};

 return useMemo(()=>({...data,index,setIndex,current,currentNotation,previousNotation:previous,save,saving,year:YEAR}),[data,index,current,currentNotation,previous,saving]);

}
