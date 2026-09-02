import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasStarterTemplate } from "@/lib/starter-templates";
import { getRecipesWithCost } from "@/lib/recipe-costs.server";
import { RecipeForm } from "./recipe-form";
import { RecipesList } from "./recipes-list";
import { AddStarterExamplesButton } from "./add-starter-examples-button";
import { TargetMarginForm } from "./target-margin-form";

export default async function RecipesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, type")
    .eq("id", id)
    .single();

  if (!establishment) {
    notFound();
  }

  const [recipesWithCost, { data: settings }] = await Promise.all([
    getRecipesWithCost(supabase, id),
    supabase.from("establishment_settings").select("marge_cible").eq("establishment_id", id).maybeSingle(),
  ]);
  const recipes = recipesWithCost
    .map(({ recipe, breakdown }) => ({
      id: recipe.id,
      nom: recipe.nom,
      portions: recipe.portions,
      prix_vente: recipe.prix_vente,
      margin: breakdown.margin,
      marginRate: breakdown.marginRate,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">Recettes</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Créez une recette puis ouvrez-la pour ajouter ses ingrédients et voir le coût de revient.
      </p>

      <div className="mt-6">
        <RecipeForm establishmentId={id} />
      </div>

      <div className="mt-4">
        <TargetMarginForm establishmentId={id} margeCible={settings?.marge_cible ?? 70} />
      </div>

      {!recipes.length && hasStarterTemplate(establishment.type) ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-line p-8 text-center">
          <p className="text-sm text-brand-muted">
            Envie de démarrer plus vite ? Ajoutez quelques recettes types pour un établissement de
            type {establishment.type}.
          </p>
          <div className="mt-4">
            <AddStarterExamplesButton establishmentId={id} type={establishment.type} />
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <RecipesList establishmentId={id} recipes={recipes} />
      </div>
    </main>
  );
}
