import { useAuth } from "@/lib/AuthContext";

import { base44 } from "@/api/base44Client";

import { LogOut, User } from "lucide-react";

export default function Profil(){const {user}=useAuth();return <section><h1 className="mb-5 text-2xl font-black">Profil</h1><div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-800"><User/></div><h2 className="text-xl font-bold">{user?.full_name||"Utilisateur"}</h2><p className="text-slate-500">{user?.email}</p><p className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{user?.role==="admin"?"Administrateur":"Prospecteur"}</p><button onClick={()=>base44.auth.logout("/login")} className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl border font-bold text-slate-700"><LogOut className="h-4 w-4"/>Se déconnecter</button></div></section>}
