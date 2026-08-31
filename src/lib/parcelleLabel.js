// Beaucoup de parcelles importées ont le même identifiant et nom — n'affiche
// l'identifiant que quand il apporte une information distincte du nom.
export function parcelleTitle(p) {
  if (!p) return "";
  return p.identifiant && p.identifiant !== p.nom ? `${p.identifiant} · ${p.nom}` : p.nom;
}
