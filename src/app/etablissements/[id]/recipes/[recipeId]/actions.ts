"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PURCHASE_UNITS } from "@/lib/constants";
import { matterCost, recipeCostBreakdown } from "@/lib/costing";
import { getMonthCostContext } from "@/lib/recipe-costs.server";

export type FormState = { error: string | null };

function parsePositiveNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function saveRecipeIngredient(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const recipeId = String(formData.get("recipe_id") ?? "");
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const ingredientId = String(formData.get("ingredient_id") ?? "");
  const unite = String(formData.get("unite") ?? "");
  const quantite = parsePositiveNumber(formData.get("quantite"));

  if (!ingredientId) return { error: "Choisissez un ingrédient." };
  if (!(PURCHASE_UNITS as readonly string[]).includes(unite)) {
    return { error: "Unité invalide." };
  }
  if (quantite === null) return { error: "La quantité doit être un nombre positif." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("recipe_ingredients")
    .upsert(
      { recipe_id: recipeId, ingredient_id: ingredientId, quantite, unite },
      { onConflict: "recipe_id,ingredient_id" }
    );

  if (error) {
    return { error: "Impossible d'ajouter cet ingrédient." };
  }

  revalidatePath(`/etablissements/${establishmentId}/recipes/${recipeId}`);
  return { error: null };
}

export async function deleteRecipeIngredient(
  id: string,
  establishmentId: string,
  recipeId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("recipe_ingredients").delete().eq("id", id);
  revalidatePath(`/etablissements/${establishmentId}/recipes/${recipeId}`);
}

export async function saveHistorySnapshot(
  establishmentId: string,
  recipeId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const [{ data: recipe }, costContext, { data: items }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, nom, portions, prix_vente")
      .eq("id", recipeId)
      .single(),
    getMonthCostContext(supabase, establishmentId),
    supabase
      .from("recipe_ingredients")
      .select("quantite, unite, ingredients(purchase_quantity, purchase_unit, purchase_price)")
      .eq("recipe_id", recipeId),
  ]);

  if (!recipe) {
    return { error: "Recette introuvable." };
  }

  const matter = matterCost(
    (items ?? []).map((item) => ({
      quantite: item.quantite,
      unite: item.unite,
      ingredient: Array.isArray(item.ingredients) ? (item.ingredients[0] ?? null) : item.ingredients,
    }))
  );
  const breakdown = recipeCostBreakdown({
    matter,
    overheadPerBatch: costContext.overheadByRecipe[recipe.id] ?? 0,
    portions: recipe.portions,
    sellingPrice: recipe.prix_vente,
    targetMarginRate: costContext.summary.targetMarginRate,
  });

  const { error } = await supabase.from("cost_history").insert({
    establishment_id: establishmentId,
    recipe_id: recipe.id,
    recipe_nom: recipe.nom,
    cout_matiere: breakdown.matter,
    quote_part_frais: breakdown.overhead,
    cout_revient_unitaire: breakdown.unitCost,
    portions: recipe.portions,
    prix_vente: recipe.prix_vente,
    marge: breakdown.margin,
    taux_marge: breakdown.marginRate,
    prix_conseille: breakdown.suggestedPrice,
  });

  if (error) {
    return { error: "Impossible d'enregistrer dans l'historique." };
  }

  revalidatePath(`/etablissements/${establishmentId}/historique`);
  return { error: null };
}
