// Palette catégorielle validée (CVD-safe) — voir la skill dataviz.
// Ordre fixe : ne jamais permuter ni régénérer une teinte pour une 9e série.
export const CATEGORICAL_COLORS = [
  "#0a89a6", // 1 teal (couleur de marque)
  "#1baf7a", // 2 aqua
  "#eda100", // 3 jaune
  "#008300", // 4 vert
  "#4a3aa7", // 5 violet
  "#e34948", // 6 rouge
  "#e87ba4", // 7 magenta
  "#eb6834", // 8 orange
] as const;

// Réservées à l'état (jamais réutilisées comme "série n") — reprend le seuil marge basse (60 %).
export const STATUS_COLORS = {
  good: "#0ca30c",
  critical: "#d03b3b",
} as const;

// Rampe séquentielle (une seule teinte, du plus clair au plus foncé) pour une série unique de magnitude.
export const SEQUENTIAL_TEAL = {
  100: "#cfeaf1",
  300: "#6dbdd3",
  500: "#0a89a6",
  700: "#0b566a",
} as const;

export const CHART_INK = {
  primary: "#17202a",
  secondary: "#52514e",
  muted: "#8a97a3",
  grid: "#e1e0d9",
  baseline: "#c3c2b7",
  surface: "#ffffff",
} as const;
