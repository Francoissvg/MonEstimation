import type { SupabaseClient } from "@supabase/supabase-js";
import { STARTER_TEMPLATES } from "./starter-templates";
import { baseUnitFor } from "./units";
import { getVocabulary } from "./vocabulary";

export async function seedStarterData(
  supabase: SupabaseClient,
  establishmentId: string,
  type: string
): Promise<{ error: string | null }> {
  const template = STARTER_TEMPLATES[type];
  if (!template) return { error: null };
  const vocab = getVocabulary(type);

  const { data: insertedIngredients, error: ingredientsError } = await supabase
    .from("ingredients")
    .insert(
      template.ingredients.map((ingredient) => ({
        establishment_id: establishmentId,
        nom: ingredient.nom,
        categorie: ingredient.categorie,
        purchase_quantity: ingredient.purchase_quantity,
        purchase_unit: ingredient.purchase_unit,
        usage_unit: baseUnitFor(ingredient.purchase_unit),
        purchase_price: ingredient.purchase_price,
      }))
    )
    .select("id, nom");

  if (ingredientsError || !insertedIngredients) {
    return { error: `Impossible d'ajouter les ${vocab.ingredientsLower} de départ.` };
  }

  const ingredientIdByNom = new Map(insertedIngredients.map((row) => [row.nom, row.id]));

  const { data: insertedRecipes, error: recipesError } = await supabase
    .from("recipes")
    .insert(
      template.recipes.map((recipe) => ({
        establishment_id: establishmentId,
        nom: recipe.nom,
        portions: recipe.portions,
        prix_vente: recipe.prix_vente,
      }))
    )
    .select("id, nom");

  if (recipesError || !insertedRecipes) {
    return {
      error: `${vocab.ingredients} en place, mais impossible d'ajouter les ${vocab.recipesLower} de départ.`,
    };
  }

  const recipeIdByNom = new Map(insertedRecipes.map((row) => [row.nom, row.id]));

  const recipeIngredientRows = template.recipes.flatMap((recipe) => {
    const recipeId = recipeIdByNom.get(recipe.nom);
    if (!recipeId) return [];
    return recipe.items.flatMap((item) => {
      const ingredientId = ingredientIdByNom.get(item.ingredient);
      if (!ingredientId) return [];
      return [
        {
          recipe_id: recipeId,
          ingredient_id: ingredientId,
          quantite: item.quantite,
          unite: item.unite,
        },
      ];
    });
  });

  const { error: linksError } = await supabase.from("recipe_ingredients").insert(recipeIngredientRows);

  if (linksError) {
    return {
      error: `${vocab.recipes} créées, mais impossible d'y ajouter les ${vocab.ingredientsLower}.`,
    };
  }

  return { error: null };
}
