const KNOWN = {
  "riesling": "#22C55E",
  "gewurztraminer": "#EC4899",
  "gewürztraminer": "#EC4899",
  "pinot auxerrois": "#F59E0B",
  "auxerrois": "#D97706",
  "pinot gris": "#A855F7",
  "pinot noir": "#DC2626",
  "pinot blanc": "#38BDF8",
  "sylvaner": "#84CC16",
  "muscat": "#F472B6",
  "cremant": "#FACC15",
  "crémant": "#FACC15",
};

// Couleur stable (non aléatoire) pour un cépage qui n'est pas dans la liste
// connue, dérivée de son nom.
function fallbackColor(cepage) {
  let hash = 0;
  for (let i = 0; i < cepage.length; i++) hash = (hash * 31 + cepage.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

export function cepageColor(cepage) {
  if (!cepage) return "#64748B";
  const key = cepage.trim().toLowerCase();
  return KNOWN[key] || fallbackColor(key);
}
