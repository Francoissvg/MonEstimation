import { pricePerUsageUnit, toBaseQuantity } from "./units";

export type IngredientForCosting = {
  purchase_quantity: number;
  purchase_unit: string;
  purchase_price: number;
};

export type RecipeIngredientForCosting = {
  quantite: number;
  unite: string;
  ingredient: IngredientForCosting | null;
};

export function matterCost(items: RecipeIngredientForCosting[]): number {
  return items.reduce((sum, item) => {
    if (!item.ingredient) return sum;
    const unitPrice = pricePerUsageUnit(
      item.ingredient.purchase_quantity,
      item.ingredient.purchase_unit,
      item.ingredient.purchase_price
    );
    const quantityInBaseUnit = toBaseQuantity(item.quantite, item.unite);
    return sum + quantityInBaseUnit * unitPrice;
  }, 0);
}

export type CostBreakdown = {
  matter: number;
  overhead: number;
  total: number;
  matterPerUnit: number;
  overheadPerUnit: number;
  unitCost: number;
  margin: number;
  marginRate: number;
  // Marge brute : prix de vente - coût de fabrication (matière) seul, sans la
  // quote-part de frais généraux. Utile pour juger la recette indépendamment
  // de la répartition des frais, qui varie d'un mois à l'autre.
  grossMargin: number;
  grossMarginRate: number;
  suggestedPrice: number;
};

// Reproduit la logique de l'app desktop : le total (matière + quote-part de frais)
// est réparti sur le nombre de portions pour obtenir le coût de revient par part.
export function recipeCostBreakdown({
  matter,
  overheadPerBatch,
  portions,
  sellingPrice,
  targetMarginRate,
}: {
  matter: number;
  overheadPerBatch: number;
  portions: number;
  sellingPrice: number;
  targetMarginRate: number;
}): CostBreakdown {
  const total = matter + overheadPerBatch;
  const safePortions = portions > 0 ? portions : 1;
  const matterPerUnit = matter / safePortions;
  const unitCost = total / safePortions;
  const margin = sellingPrice - unitCost;
  const marginRate = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;
  const grossMargin = sellingPrice - matterPerUnit;
  const grossMarginRate = sellingPrice > 0 ? (grossMargin / sellingPrice) * 100 : 0;
  const suggestedPrice = targetMarginRate < 1 ? unitCost / (1 - targetMarginRate) : 0;
  return {
    matter,
    overhead: overheadPerBatch,
    total,
    matterPerUnit,
    overheadPerUnit: overheadPerBatch / safePortions,
    unitCost,
    margin,
    marginRate,
    grossMargin,
    grossMarginRate,
    suggestedPrice,
  };
}

export type RecipeOverheadInput = {
  id: string;
  prixVente: number;
  portions: number;
  forecastQuantity: number; // fournées prévues sur le mois
};

// Répartit les frais généraux entre les recettes au prorata de leur chiffre
// d'affaires prévisionnel (prix de vente x parts x prévisionnel) : une recette
// chère et/ou à fort volume absorbe plus de frais qu'une recette bon marché.
// Sans aucune recette prévisionnalisée et tarifée, impossible de calculer un
// prorata : aucun frais n'est attribué tant qu'un prix et un prévisionnel ne
// sont pas renseignés sur au moins une recette.
export function allocateOverhead(
  recipes: RecipeOverheadInput[],
  totalOverhead: number
): Map<string, number> {
  const totalRevenue = recipes.reduce((sum, r) => {
    if (r.prixVente <= 0 || r.forecastQuantity <= 0) return sum;
    return sum + r.prixVente * r.portions * r.forecastQuantity;
  }, 0);

  const overheadByRecipe = new Map<string, number>();

  if (totalRevenue > 0) {
    for (const r of recipes) {
      const overheadPerPart = r.prixVente > 0 ? (totalOverhead * r.prixVente) / totalRevenue : 0;
      overheadByRecipe.set(r.id, overheadPerPart * r.portions);
    }
  } else {
    for (const r of recipes) overheadByRecipe.set(r.id, 0);
  }

  return overheadByRecipe;
}

export type EmployeeForCosting = {
  salary_mode: string;
  hourly_rate: number;
  hours_per_week: number;
  monthly_salary: number;
  active_months?: number[] | null;
};

export type FixedCostForCosting = {
  montant: number;
  frequence: string;
  active_months?: number[] | null;
};

// Semaines moyennes par mois (52 semaines / 12), reprise de l'app desktop.
const AVERAGE_WEEKS_PER_MONTH = 4.33;

export function employeeMonthlyCost(employee: EmployeeForCosting): number {
  if (employee.salary_mode === "mensuel") return employee.monthly_salary;
  return employee.hourly_rate * employee.hours_per_week * AVERAGE_WEEKS_PER_MONTH;
}

export function fixedCostMonthlyAmount(cost: FixedCostForCosting): number {
  return cost.frequence === "annuel" ? cost.montant / 12 : cost.montant;
}

// NULL/vide = actif toute l'année. Sinon, actif seulement pour les mois listés (1-12).
export function isActiveInMonth(activeMonths: number[] | null | undefined, month: number): boolean {
  return !activeMonths || activeMonths.length === 0 || activeMonths.includes(month);
}

export type MonthlyCostsSummary = {
  salary: number;
  fixed: number;
  utilities: number;
  total: number;
  monthlyUnits: number; // total de parts prévues, à titre indicatif
  unitOverhead: number; // frais moyens par part, à titre indicatif — le calcul réel par recette
  // (voir allocateOverhead) pondère par le prix de vente, donc varie d'une recette à l'autre.
  targetMarginRate: number;
};

// Total des frais généraux mensuels (salaires + charges fixes + énergie), avec une
// moyenne par part à titre indicatif. La répartition réelle entre recettes se fait
// via allocateOverhead(), au prorata du chiffre d'affaires prévisionnel.
export function monthlyCostsSummary({
  employees,
  fixedCosts,
  utilitiesTotal,
  forecastQuantity,
  margeCible,
}: {
  employees: EmployeeForCosting[];
  fixedCosts: FixedCostForCosting[];
  utilitiesTotal: number;
  forecastQuantity: number;
  margeCible: number;
}): MonthlyCostsSummary {
  const salary = employees.reduce((sum, e) => sum + employeeMonthlyCost(e), 0);
  const fixed = fixedCosts.reduce((sum, c) => sum + fixedCostMonthlyAmount(c), 0);
  const total = salary + fixed + utilitiesTotal;
  const monthlyUnits = forecastQuantity;
  return {
    salary,
    fixed,
    utilities: utilitiesTotal,
    total,
    monthlyUnits,
    unitOverhead: monthlyUnits > 0 ? total / monthlyUnits : 0,
    targetMarginRate: margeCible / 100,
  };
}
