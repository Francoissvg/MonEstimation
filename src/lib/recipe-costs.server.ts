import type { SupabaseClient } from "@supabase/supabase-js";
import {
  allocateOverhead,
  isActiveInMonth,
  matterCost,
  monthlyCostsSummary,
  recipeCostBreakdown,
  type CostBreakdown,
  type MonthlyCostsSummary,
  type RecipeIngredientForCosting,
  type RecipeOverheadInput,
} from "./costing";
import { currentMonth, currentYear } from "./months";
import { baseUnitFor, pricePerUsageUnit, toBaseQuantity } from "./units";

export { currentMonth, currentYear };

// Moyenne historique des relevés d'énergie/eau pour un mois donné (tous calendaires
// confondus) : capture la saisonnalité réelle sans ressaisie manuelle.
function averageUtilitiesForMonth(
  utilities: { prix: number; recorded_at: string }[],
  month: number
): number {
  const matching = utilities.filter((u) => new Date(u.recorded_at).getMonth() + 1 === month);
  if (!matching.length) return 0;
  return matching.reduce((sum, u) => sum + u.prix, 0) / matching.length;
}

export type RecipeForCosting = {
  id: string;
  nom: string;
  portions: number;
  prix_vente: number;
  forecast_quantity: number;
};

export type MonthCostContext = {
  summary: MonthlyCostsSummary;
  // Quote-part de frais pour UNE fournée de chaque recette, au prorata du CA
  // prévisionnel (voir allocateOverhead dans costing.ts).
  overheadByRecipe: Record<string, number>;
  recipes: RecipeForCosting[];
};

// Point d'entrée central : calcule les frais généraux du mois puis leur répartition
// entre les recettes, en une seule fois (évite de refaire la même requête plusieurs fois).
export async function getMonthCostContext(
  supabase: SupabaseClient,
  establishmentId: string,
  month: number = currentMonth()
): Promise<MonthCostContext> {
  const [{ data: settings }, { data: employees }, { data: fixedCosts }, { data: utilities }, { data: recipes }] =
    await Promise.all([
      supabase
        .from("establishment_settings")
        .select("marge_cible")
        .eq("establishment_id", establishmentId)
        .maybeSingle(),
      supabase
        .from("employees")
        .select("salary_mode, hourly_rate, hours_per_week, monthly_salary, active_months")
        .eq("establishment_id", establishmentId)
        .eq("active", true),
      supabase
        .from("fixed_costs")
        .select("montant, frequence, active_months")
        .eq("establishment_id", establishmentId)
        .eq("active", true),
      supabase.from("utilities").select("prix, recorded_at").eq("establishment_id", establishmentId),
      supabase
        .from("recipes")
        .select("id, nom, portions, prix_vente")
        .eq("establishment_id", establishmentId)
        .order("nom"),
    ]);

  const activeEmployees = (employees ?? []).filter((e) => isActiveInMonth(e.active_months, month));
  const activeFixedCosts = (fixedCosts ?? []).filter((c) => isActiveInMonth(c.active_months, month));
  const utilitiesTotal = averageUtilitiesForMonth(utilities ?? [], month);
  const margeCible = settings?.marge_cible ?? 70;

  const recipeList = recipes ?? [];
  const ids = recipeList.map((r) => r.id);

  let forecastByRecipe = new Map<string, number>();
  if (ids.length) {
    const { data: forecasts } = await supabase
      .from("recipe_monthly_forecasts")
      .select("recipe_id, quantity")
      .in("recipe_id", ids)
      .eq("month", month);
    forecastByRecipe = new Map((forecasts ?? []).map((f) => [f.recipe_id, f.quantity]));
  }

  const overheadInputs: RecipeOverheadInput[] = recipeList.map((r) => ({
    id: r.id,
    prixVente: r.prix_vente,
    portions: r.portions,
    forecastQuantity: forecastByRecipe.get(r.id) ?? 0,
  }));
  const totalPartsForecast = overheadInputs.reduce((sum, r) => sum + r.forecastQuantity * r.portions, 0);

  const summary = monthlyCostsSummary({
    employees: activeEmployees,
    fixedCosts: activeFixedCosts,
    utilitiesTotal,
    forecastQuantity: totalPartsForecast,
    margeCible,
  });

  const overheadMap = allocateOverhead(overheadInputs, summary.total);
  const overheadByRecipe: Record<string, number> = {};
  for (const [id, value] of overheadMap) overheadByRecipe[id] = value;

  return {
    summary,
    overheadByRecipe,
    recipes: recipeList.map((r) => ({
      ...r,
      forecast_quantity: forecastByRecipe.get(r.id) ?? 0,
    })),
  };
}

export async function getMonthlyCostsSummary(
  supabase: SupabaseClient,
  establishmentId: string,
  month: number = currentMonth()
): Promise<MonthlyCostsSummary> {
  const context = await getMonthCostContext(supabase, establishmentId, month);
  return context.summary;
}

export async function getRecipesWithCost(
  supabase: SupabaseClient,
  establishmentId: string,
  month: number = currentMonth()
): Promise<{ recipe: RecipeForCosting; breakdown: CostBreakdown }[]> {
  const context = await getMonthCostContext(supabase, establishmentId, month);
  if (!context.recipes.length) return [];

  const { data: recipeIngredients } = await supabase
    .from("recipe_ingredients")
    .select("recipe_id, quantite, unite, ingredients(purchase_quantity, purchase_unit, purchase_price)")
    .in(
      "recipe_id",
      context.recipes.map((r) => r.id)
    );

  const itemsByRecipe = new Map<string, RecipeIngredientForCosting[]>();
  for (const item of recipeIngredients ?? []) {
    const list = itemsByRecipe.get(item.recipe_id) ?? [];
    list.push({
      quantite: item.quantite,
      unite: item.unite,
      ingredient: Array.isArray(item.ingredients) ? (item.ingredients[0] ?? null) : item.ingredients,
    });
    itemsByRecipe.set(item.recipe_id, list);
  }

  return context.recipes.map((recipe) => {
    const matter = matterCost(itemsByRecipe.get(recipe.id) ?? []);
    const breakdown = recipeCostBreakdown({
      matter,
      overheadPerBatch: context.overheadByRecipe[recipe.id] ?? 0,
      portions: recipe.portions,
      sellingPrice: recipe.prix_vente,
      targetMarginRate: context.summary.targetMarginRate,
    });
    return { recipe, breakdown };
  });
}

export type PlanningIngredientNeed = {
  ingredientId: string;
  nom: string;
  quantityPerBatch: number; // dans l'unité de base (g, ml ou pièce)
  usageUnit: string;
  unitPrice: number;
};

export type PlanningRecipeData = {
  id: string;
  nom: string;
  portions: number;
  prixVente: number;
  matterPerBatch: number;
  monthlyForecasts: number[]; // index 0 = janvier ... 11 = décembre
  ingredients: PlanningIngredientNeed[];
};

export type PlanningData = {
  recipes: PlanningRecipeData[];
  employees: { salary_mode: string; hourly_rate: number; hours_per_week: number; monthly_salary: number; active_months: number[] | null }[];
  fixedCosts: { montant: number; frequence: string; active_months: number[] | null }[];
  utilitiesByMonth: number[]; // moyenne historique par mois calendaire, index 0 = janvier
  margeCible: number;
  actualsYear: number;
  actuals: Record<string, number[]>; // ventes réellement saisies pour l'année en cours, index 0 = janvier
};

// Toutes les données nécessaires au planning annuel, calculables entièrement côté
// client ensuite (aucun aller-retour serveur nécessaire pour changer de mois).
export async function getPlanningData(
  supabase: SupabaseClient,
  establishmentId: string
): Promise<PlanningData> {
  const [
    { data: recipes },
    { data: employees },
    { data: fixedCosts },
    { data: utilities },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, nom, portions, prix_vente")
      .eq("establishment_id", establishmentId)
      .order("nom"),
    supabase
      .from("employees")
      .select("salary_mode, hourly_rate, hours_per_week, monthly_salary, active_months")
      .eq("establishment_id", establishmentId)
      .eq("active", true),
    supabase
      .from("fixed_costs")
      .select("montant, frequence, active_months")
      .eq("establishment_id", establishmentId)
      .eq("active", true),
    supabase.from("utilities").select("prix, recorded_at").eq("establishment_id", establishmentId),
    supabase
      .from("establishment_settings")
      .select("marge_cible")
      .eq("establishment_id", establishmentId)
      .maybeSingle(),
  ]);

  const utilitiesByMonth = Array.from({ length: 12 }, (_, i) =>
    averageUtilitiesForMonth(utilities ?? [], i + 1)
  );

  const actualsYear = currentYear();

  if (!recipes?.length) {
    return {
      recipes: [],
      employees: employees ?? [],
      fixedCosts: fixedCosts ?? [],
      utilitiesByMonth,
      margeCible: settings?.marge_cible ?? 70,
      actualsYear,
      actuals: {},
    };
  }

  const recipeIds = recipes.map((r) => r.id);
  const [{ data: recipeIngredients }, { data: forecasts }, { data: actualsRows }] = await Promise.all([
    supabase
      .from("recipe_ingredients")
      .select(
        "recipe_id, quantite, unite, ingredient_id, ingredients(id, nom, purchase_quantity, purchase_unit, purchase_price)"
      )
      .in("recipe_id", recipeIds),
    supabase.from("recipe_monthly_forecasts").select("recipe_id, month, quantity").in("recipe_id", recipeIds),
    supabase
      .from("recipe_monthly_actuals")
      .select("recipe_id, month, quantity")
      .in("recipe_id", recipeIds)
      .eq("year", actualsYear),
  ]);

  const itemsByRecipe = new Map<string, RecipeIngredientForCosting[]>();
  const ingredientNeedsByRecipe = new Map<string, PlanningIngredientNeed[]>();
  for (const item of recipeIngredients ?? []) {
    const ingredient = Array.isArray(item.ingredients) ? (item.ingredients[0] ?? null) : item.ingredients;

    const list = itemsByRecipe.get(item.recipe_id) ?? [];
    list.push({ quantite: item.quantite, unite: item.unite, ingredient });
    itemsByRecipe.set(item.recipe_id, list);

    if (ingredient) {
      const needs = ingredientNeedsByRecipe.get(item.recipe_id) ?? [];
      needs.push({
        ingredientId: item.ingredient_id,
        nom: ingredient.nom,
        quantityPerBatch: toBaseQuantity(item.quantite, item.unite),
        usageUnit: baseUnitFor(ingredient.purchase_unit),
        unitPrice: pricePerUsageUnit(
          ingredient.purchase_quantity,
          ingredient.purchase_unit,
          ingredient.purchase_price
        ),
      });
      ingredientNeedsByRecipe.set(item.recipe_id, needs);
    }
  }

  const forecastsByRecipe = new Map<string, number[]>();
  for (const recipe of recipes) {
    forecastsByRecipe.set(recipe.id, new Array(12).fill(0));
  }
  for (const f of forecasts ?? []) {
    const months = forecastsByRecipe.get(f.recipe_id);
    if (months) months[f.month - 1] = f.quantity;
  }

  const actuals: Record<string, number[]> = {};
  for (const recipe of recipes) {
    actuals[recipe.id] = new Array(12).fill(0);
  }
  for (const a of actualsRows ?? []) {
    const months = actuals[a.recipe_id];
    if (months) months[a.month - 1] = a.quantity;
  }

  return {
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      nom: recipe.nom,
      portions: recipe.portions,
      prixVente: recipe.prix_vente,
      matterPerBatch: matterCost(itemsByRecipe.get(recipe.id) ?? []),
      monthlyForecasts: forecastsByRecipe.get(recipe.id) ?? new Array(12).fill(0),
      ingredients: ingredientNeedsByRecipe.get(recipe.id) ?? [],
    })),
    employees: employees ?? [],
    fixedCosts: fixedCosts ?? [],
    utilitiesByMonth,
    margeCible: settings?.marge_cible ?? 70,
    actualsYear,
    actuals,
  };
}

export type StockNeed = { nom: string; usageUnit: string; quantity: number; cost: number };

// Quantité de chaque ingrédient nécessaire pour honorer le prévisionnel d'un mois donné,
// toutes recettes confondues — utilisé par le Rapport ("Besoins en approvisionnement").
export async function getStockNeeds(
  supabase: SupabaseClient,
  establishmentId: string,
  month: number = currentMonth()
): Promise<{ needs: StockNeed[]; totalCost: number }> {
  const planning = await getPlanningData(supabase, establishmentId);
  const needs = new Map<string, StockNeed>();

  for (const recipe of planning.recipes) {
    const forecastQty = recipe.monthlyForecasts[month - 1] ?? 0;
    if (forecastQty <= 0) continue;
    for (const ingredient of recipe.ingredients) {
      const existing = needs.get(ingredient.ingredientId) ?? {
        nom: ingredient.nom,
        usageUnit: ingredient.usageUnit,
        quantity: 0,
        cost: 0,
      };
      existing.quantity += forecastQty * ingredient.quantityPerBatch;
      existing.cost += forecastQty * ingredient.quantityPerBatch * ingredient.unitPrice;
      needs.set(ingredient.ingredientId, existing);
    }
  }

  const sorted = Array.from(needs.values()).sort((a, b) => b.cost - a.cost);
  return { needs: sorted, totalCost: sorted.reduce((sum, n) => sum + n.cost, 0) };
}

export type ForecastVsActualDatum = { label: string; forecast: number; actual: number };

export type ForecastVsActualData = {
  items: ForecastVsActualDatum[]; // top 8 recettes par prévisionnel cumulé, pour le graphique
  totalForecast: number;
  totalActual: number;
};

// Cumul du prévisionnel et du réalisé depuis janvier jusqu'au mois donné (année en cours),
// pour mesurer l'écart entre ce qui était anticipé et ce qui a effectivement été vendu.
export async function getForecastVsActualData(
  supabase: SupabaseClient,
  establishmentId: string,
  uptoMonth: number = currentMonth(),
  year: number = currentYear()
): Promise<ForecastVsActualData> {
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, nom")
    .eq("establishment_id", establishmentId);

  if (!recipes?.length) {
    return { items: [], totalForecast: 0, totalActual: 0 };
  }

  const ids = recipes.map((r) => r.id);
  const months = Array.from({ length: uptoMonth }, (_, i) => i + 1);

  const [{ data: forecasts }, { data: actuals }] = await Promise.all([
    supabase.from("recipe_monthly_forecasts").select("recipe_id, quantity").in("recipe_id", ids).in("month", months),
    supabase
      .from("recipe_monthly_actuals")
      .select("recipe_id, quantity")
      .in("recipe_id", ids)
      .eq("year", year)
      .in("month", months),
  ]);

  const forecastByRecipe = new Map<string, number>();
  for (const f of forecasts ?? []) {
    forecastByRecipe.set(f.recipe_id, (forecastByRecipe.get(f.recipe_id) ?? 0) + f.quantity);
  }
  const actualByRecipe = new Map<string, number>();
  for (const a of actuals ?? []) {
    actualByRecipe.set(a.recipe_id, (actualByRecipe.get(a.recipe_id) ?? 0) + a.quantity);
  }

  const all = recipes.map((r) => ({
    label: r.nom,
    forecast: forecastByRecipe.get(r.id) ?? 0,
    actual: actualByRecipe.get(r.id) ?? 0,
  }));

  return {
    items: all
      .filter((d) => d.forecast > 0 || d.actual > 0)
      .sort((a, b) => b.forecast - a.forecast)
      .slice(0, 8),
    totalForecast: all.reduce((sum, d) => sum + d.forecast, 0),
    totalActual: all.reduce((sum, d) => sum + d.actual, 0),
  };
}

export type AnnualRevenueForecast = {
  byMonth: number[]; // CA prévisionnel par mois, index 0 = janvier
  total: number;
};

// CA prévisionnel sur les 12 mois de l'année, toutes recettes tarifées confondues
// (prix de vente x parts x prévisionnel du mois). Utilisé pour le graphique annuel du Rapport.
export async function getAnnualRevenueForecast(
  supabase: SupabaseClient,
  establishmentId: string
): Promise<AnnualRevenueForecast> {
  const byMonth = new Array(12).fill(0);

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, portions, prix_vente")
    .eq("establishment_id", establishmentId);

  if (!recipes?.length) return { byMonth, total: 0 };

  const ids = recipes.map((r) => r.id);
  const { data: forecasts } = await supabase
    .from("recipe_monthly_forecasts")
    .select("recipe_id, month, quantity")
    .in("recipe_id", ids);

  const recipeById = new Map(recipes.map((r) => [r.id, r]));
  for (const f of forecasts ?? []) {
    const recipe = recipeById.get(f.recipe_id);
    if (!recipe || recipe.prix_vente <= 0) continue;
    byMonth[f.month - 1] += f.quantity * recipe.portions * recipe.prix_vente;
  }

  return { byMonth, total: byMonth.reduce((sum, v) => sum + v, 0) };
}
