import { NavLink, Outlet } from "react-router-dom";

import { Map, ClipboardCheck, History, User, Settings } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";

const items = [["/carte","Carte",Map],["/","Prospection",ClipboardCheck],["/historique","Historique",History],["/profil","Profil",User]];

export default function MobileLayout() {

  const { user } = useAuth();

  const links = user?.role === "admin" ? [...items, ["/admin","Admin",Settings]] : items;

  return <div className="min-h-screen bg-[#f4f7f3] pb-24">

    <header className="sticky top-0 z-30 border-b border-emerald-950/10 bg-[#f4f7f3]/95 px-4 py-3 backdrop-blur">

      <div className="mx-auto flex max-w-5xl items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-sm font-black text-white">MDB</div><div><p className="font-semibold text-emerald-950">Observatoire MDB</p><p className="text-xs text-emerald-800/70">Campagne {new Date().getFullYear()}</p></div></div>

    </header>

    <main className="mx-auto max-w-5xl p-4"><Outlet /></main>

    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">

      <div className="mx-auto flex max-w-xl justify-around">{links.map(([to,label,Icon]) => <NavLink key={to} to={to} end={to==="/"} className={({isActive})=>`flex min-w-16 flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium ${isActive?"text-emerald-800":"text-slate-500"}`}><Icon className="h-5 w-5"/>{label}</NavLink>)}</div>

    </nav>

  </div>;

}
