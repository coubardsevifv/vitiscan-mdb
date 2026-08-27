import { NavLink, Outlet, Link } from "react-router-dom";

import { LayoutDashboard, MapPin, Tags, Users, Upload, Download, ArrowLeft } from "lucide-react";

import { useAuth } from "@/lib/AuthContext";

const nav = [

  ["/admin", "Tableau de bord", LayoutDashboard, true],

  ["/admin/parcelles", "Parcelles", MapPin, false],

  ["/admin/categories", "Notations", Tags, false],

  ["/admin/import", "Import 2025", Upload, false],

  ["/admin/export", "Export", Download, false],

  ["/admin/users", "Utilisateurs", Users, false],

];

export default function AdminLayout() {

  const { user } = useAuth();

  if (user?.role !== "admin") return <div className="grid min-h-screen place-items-center p-8 text-center"><div><p className="text-xl font-bold mb-2 text-slate-900">Accès refusé</p><p className="text-slate-500 mb-4">Cet espace est réservé aux administrateurs.</p><Link to="/" className="inline-block text-emerald-700 font-bold">← Retour à l'application</Link></div></div>;

  return (

    <div className="min-h-screen bg-slate-50">

      <aside className="fixed inset-y-0 left-0 z-30 w-60 border-r border-slate-200 bg-white">

        <div className="p-5"><Link to="/admin" className="flex items-center gap-2.5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-800 text-sm font-black text-white">MDB</div><div><p className="font-bold text-slate-900 leading-tight">Admin MDB</p><p className="text-xs text-slate-500">Observatoire</p></div></Link></div>

        <nav className="px-3 space-y-0.5">{nav.map(([to, label, Icon, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100"}`}><Icon className="h-4 w-4" />{label}</NavLink>)}</nav>

        <div className="absolute inset-x-3 bottom-3"><Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" />Retour à l'app</Link></div>

      </aside>

      <div className="ml-60 p-8"><Outlet /></div>

    </div>

  );

}
