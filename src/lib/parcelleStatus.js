// Statut d'une parcelle pour une campagne : combine la progression réelle de
// saisie (placettes entièrement notées via l'app) et le statut manuel de sa
// Prospection (utile quand la prospection a été faite sur papier et
// marquée "terminée" a posteriori, sans notations dans l'app).
export function computeParcelleStatus(parcelleId, { placettes, notations, prospection }) {
  const ps = placettes.filter((x) => x.parcelle_id === parcelleId);
  const finished = ps.filter((x) => notations.filter((n) => n.placette_id === x.id).length >= x.nombre_emplacements).length;
  const appComplete = ps.length > 0 && finished === ps.length;
  const manualComplete = prospection?.statut === "terminee";

  if (appComplete || manualComplete) return "terminee";

  const anyProgress = finished > 0 || prospection?.statut === "en_cours";
  return anyProgress ? "en_cours" : "a_faire";
}
