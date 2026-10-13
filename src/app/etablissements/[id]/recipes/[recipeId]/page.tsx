import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { matterCost, recipeCostBreakdown } from "@/lib/costing";
import { currentMonth, getMonthCostContext } from "@/lib/recipe-costs.server";
import { StatTile } from "@/components/stat-tile";
import { ghostLinkClass } from "@/lib/ui";
import { money } from "@/lib/format";
import { MONTH_LABELS } from "@/lib/months";
import { RecipeForm } from "../recipe-form";
import { RecipeIngredientsManager, type RecipeIngredientRow } from "./recipe-ingredients-manager";
import { IngredientPicker } from "./ingredient-picker";
import { SaveHistoryButton } from "./save-history-button";
import { RecipeForecastEditor } from "./recipe-forecast-editor";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string; recipeId: string }>;
}) {
  const { id, recipeId } = await params;
  const vocab = await getEstablishmentVocabulary(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [
    { data: establishment },
    { data: recipe },
    costContext,
    { data: allIngredients },
    { data: recipeIngredients },
    { data: monthlyForecasts },
  ] = await Promise.all([
    supabase.from("establishments").select("id, nom").eq("id", id).single(),
    supabase
      .from("recipes")
      .select("id, nom, portions, prix_vente")
      .eq("id", recipeId)
      .single(),
    getMonthCostContext(supabase, id),
    supabase
      .from("ingredients")
      .select("id, nom, categorie, purchase_quantity, purchase_unit, purchase_price")
      .eq("establishment_id", id)
      .order("nom"),
    supabase
      .from("recipe_ingredients")
      .select(
        "id, quantite, unite, ingredient_id, ingredients(id, nom, categorie, purchase_quantity, purchase_unit, purchase_price)"
      )
      .eq("recipe_id", recipeId),
    supabase.from("recipe_monthly_forecasts").select("month, quantity").eq("recipe_id", recipeId),
  ]);

  if (!establishment || !recipe) {
    notFound();
  }

  const initialForecasts = new Array(12).fill(0);
  for (const f of monthlyForecasts ?? []) {
    initialForecasts[f.month - 1] = f.quantity;
  }

  const items: RecipeIngredientRow[] = (recipeIngredients ?? []).map((row) => ({
    id: row.id,
    quantite: row.quantite,
    unite: row.unite,
    ingredient_id: row.ingredient_id,
    ingredient: Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients,
  }));

  const matter = matterCost(
    items.map((item) => ({ quantite: item.quantite, unite: item.unite, ingredient: item.ingredient }))
  );
  const breakdown = recipeCostBreakdown({
    matter,
    overheadPerBatch: costContext.overheadByRecipe[recipe.id] ?? 0,
    portions: recipe.portions,
    sellingPrice: recipe.prix_vente,
    targetMarginRate: costContext.summary.targetMarginRate,
  });

  const hasOverheadConfigured = costContext.summary.monthlyUnits > 0;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <Link href={`/etablissements/${id}/recipes`} className={ghostLinkClass}>
        ← {vocab.recipes}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">{recipe.nom}</h1>

      <div className="mt-6">
        <RecipeForm
          establishmentId={id}
          editing={{
            id: recipe.id,
            nom: recipe.nom,
            portions: recipe.portions,
            prix_vente: recipe.prix_vente,
          }}
        />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-brand-ink">{vocab.ingredients} de la {vocab.recipeLower}</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <IngredientPicker
          establishmentId={id}
          ownerId={recipe.id}
          availableIngredients={allIngredients ?? []}
        />
        <RecipeIngredientsManager establishmentId={id} ownerId={recipe.id} items={items} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-brand-ink">Résumé de la {vocab.batch}</h2>
      {vocab.showPortions ? (
        <p className="mt-1 text-sm text-brand-muted">
          Une fournée de cette recette donne {recipe.portions} part(s), vendue(s){" "}
          {money(recipe.prix_vente)} chacune.
        </p>
      ) : null}
      <div className={`mt-3 grid grid-cols-2 gap-3 ${vocab.showPortions ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        {vocab.showPortions ? (
          <StatTile label="Parts par fournée" value={String(recipe.portions)} icon="🍰" />
        ) : null}
        <StatTile label={`Coût total (${vocab.batch})`} value={money(breakdown.total)} icon="🧾" />
        <StatTile
          label={`CA total (${vocab.batch})`}
          value={money(recipe.prix_vente * recipe.portions)}
          icon="💰"
        />
        <StatTile
          label={`Marge totale (${vocab.batch})`}
          value={money(recipe.prix_vente * recipe.portions - breakdown.total)}
          tone="accent"
          icon="➕"
        />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-brand-ink">Prévisionnel mensuel</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Nombre de {vocab.batches} prévues chaque mois pour cette {vocab.recipeLower} — utilisé pour répartir les frais
        généraux et alimenter la page{" "}
        <Link href={`/etablissements/${id}/projection`} className="underline">
          Prévisionnel
        </Link>
        .
      </p>
      <div className="mt-3">
        <RecipeForecastEditor establishmentId={id} recipeId={recipe.id} initialForecasts={initialForecasts} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-brand-ink">Coût de revient par {vocab.part}</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Calculé pour {MONTH_LABELS[currentMonth() - 1]} (
        <Link href={`/etablissements/${id}/projection`} className="underline">
          voir un autre mois dans Prévisionnel
        </Link>
        ), avec la marge cible de l&apos;établissement (
        {costContext.summary.targetMarginRate * 100}%,{" "}
        <Link href={`/etablissements/${id}/recipes`} className="underline">
          modifiable ici
        </Link>
        ).
      </p>
      {!hasOverheadConfigured ? (
        <p className="mt-2 text-sm text-brand-warning">
          Aucun frais général n&apos;est configuré —{" "}
          <Link href={`/etablissements/${id}/parametres`} className="underline">
            réglez-les ici
          </Link>{" "}
          pour inclure une quote-part de charges dans le calcul.
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={vocab.matterCost} value={money(breakdown.matter)} icon="🧺" />
        <StatTile label="Quote-part frais" value={money(breakdown.overhead)} icon="🧾" />
        <StatTile label={`Coût de revient / ${vocab.part}`} value={money(breakdown.unitCost)} tone="accent" icon="💶" />
        <StatTile label="Prix conseillé" value={money(breakdown.suggestedPrice)} tone="accent" icon="🏷️" />
        <StatTile label={`Marge / ${vocab.part}`} value={money(breakdown.margin)} icon="➕" />
        <StatTile
          label="Taux de marge"
          value={`${breakdown.marginRate.toFixed(1)}%`}
          tone={breakdown.marginRate >= 60 ? "success" : "danger"}
          icon="📈"
        />
        <StatTile
          label={`Marge brute / ${vocab.part} (sans les frais)`}
          value={money(breakdown.grossMargin)}
          icon="➕"
        />
        <StatTile
          label="Taux de marge brute"
          value={`${breakdown.grossMarginRate.toFixed(1)}%`}
          tone={breakdown.grossMarginRate >= 60 ? "success" : "danger"}
          icon="📈"
        />
      </div>

      <div className="mt-6">
        <SaveHistoryButton establishmentId={id} recipeId={recipe.id} />
      </div>
    </main>
  );
}
