const styles={a_faire:"bg-slate-100 text-slate-600",en_cours:"bg-amber-100 text-amber-800",terminee:"bg-emerald-100 text-emerald-800"};

const labels={a_faire:"À faire",en_cours:"En cours",terminee:"Terminée"};

export default function StatusBadge({status="a_faire"}){return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>}
