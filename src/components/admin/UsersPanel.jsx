import { useEffect, useState } from "react";
import { supabase } from "@/api/base44Client";

export default function UsersPanel(){
  const [users,setUsers]=useState([]);
  const load=()=>supabase.from("profiles").select("*").order("created_at").then(({data})=>setUsers(data||[]));
  useEffect(load,[]);
  const toggleRole=async u=>{
    const role=u.role==="admin"?"user":"admin";
    await supabase.from("profiles").update({role}).eq("id",u.id);
    load();
  };
  const setOrganisme=async(u,organisme)=>{
    await supabase.from("profiles").update({organisme:organisme||null}).eq("id",u.id);
    load();
  };
  return <div>
    <h2 className="mb-3 text-lg font-bold">Utilisateurs</h2>
    <p className="mb-4 text-sm text-slate-500">Les utilisateurs créent leur compte eux-mêmes via la page d'inscription. Attribuez le rôle admin et l'organisme ici — un utilisateur ne voit que les parcelles de son organisme.</p>
    <div className="divide-y rounded-xl border">
      {users.map(u=>
        <div key={u.id} className="flex items-center justify-between gap-3 p-3">
          <span className="flex-1">{u.full_name||u.email}</span>
          <input
            defaultValue={u.organisme||""}
            placeholder="organisme"
            onBlur={e=>{if(e.target.value!==(u.organisme||""))setOrganisme(u,e.target.value.trim())}}
            className="h-9 w-32 rounded-lg border px-2 text-sm"
          />
          <button onClick={()=>toggleRole(u)} className={`rounded-full px-3 py-1 text-xs font-bold ${u.role==="admin"?"bg-emerald-100 text-emerald-800":"bg-slate-100 text-slate-500"}`}>{u.role==="admin"?"Admin":"Prospecteur"}</button>
        </div>
      )}
    </div>
    {!users.length&&<p className="py-8 text-center text-slate-500">Aucun utilisateur inscrit pour l'instant.</p>}
  </div>;
}
