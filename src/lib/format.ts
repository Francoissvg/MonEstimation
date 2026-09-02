export function money(value: number): string {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function number(value: number): string {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

// Pour les petits montants unitaires (coût d'une ligne d'ingrédient dans une recette).
export function moneyPrecise(value: number): string {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} €`;
}
