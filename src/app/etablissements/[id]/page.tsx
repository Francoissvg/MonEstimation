import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMonthlyCostsSummary, getRecipesWithCost } from "@/lib/recipe-costs.server";
import { StatTile } from "@/components/stat-tile";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { money, number } from "@/lib/format";
import { MONTH_LABELS } from "@/lib/months";
import { cardClass, cardHoverClass } from "@/lib/ui";
import { DashboardRecipesTable } from "./dashboard-recipes-table";
import { ExportIcon, ForecastIcon, FraisIcon, IngredientsIcon, ReportIcon } from "@/components/nav-icons";

const LOW_MARGIN_RATE = 60;

const QUICK_LINKS = [
  { href: "ingredients", icon: IngredientsIcon, label: "Ingrédients", description: "Prix d'achat et fournisseurs" },
  { href: "parametres", icon: FraisIcon, label: "Frais généraux", description: "Salariés, charges, énergie" },
  { href: "projection", icon: ForecastIcon, label: "Prévisionnel", description: "Ventes et frais mois par mois" },
  { href: "rapport", icon: ReportIcon, label: "Rapport", description: "Marges et évolution des coûts" },
  { href: "export", icon: ExportIcon, label: "Export complet", description: "Tout l'établissement en PDF/Excel" },
] as const;

export default async function DashboardPage({
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

  const [recipesWithCost, summary, { count: ingredientsCount }] = await Promise.all([
    getRecipesWithCost(supabase, id),
    getMonthlyCostsSummary(supabase, id),
    supabase.from("ingredients").select("id", { count: "exact", head: true }).eq("establishment_id", id),
  ]);

  const priced = recipesWithCost.filter((r) => r.recipe.prix_vente > 0);
  const isEmpty = recipesWithCost.length === 0 && (ingredientsCount ?? 0) === 0;

  const averageMarginRate = priced.length
    ? priced.reduce((sum, r) => sum + r.breakdown.marginRate, 0) / priced.length
    : 0;

  const mostProfitable = priced.length
    ? priced.reduce((best, r) => (r.breakdown.marginRate > best.breakdown.marginRate ? r : best))
    : null;

  const lowMarginCount = priced.filter((r) => r.breakdown.marginRate < LOW_MARGIN_RATE).length;

  const monthRevenue = recipesWithCost.reduce((sum, r) => {
    if (r.recipe.prix_vente <= 0 || r.recipe.forecast_quantity <= 0) return sum;
    return sum + r.recipe.forecast_quantity * r.recipe.portions * r.recipe.prix_vente;
  }, 0);
  // Toujours les frais généraux complets (payés que les recettes aient un prévisionnel
  // ou non) + le coût matière de toutes les recettes prévisionnalisées, même sans prix
  // de vente — sinon le coût total sous-estime la réalité dès qu'un prix manque.
  const monthMatterCost = recipesWithCost.reduce((sum, r) => {
    if (r.recipe.forecast_quantity <= 0) return sum;
    return sum + r.recipe.forecast_quantity * r.breakdown.matter;
  }, 0);
  const monthCost = summary.total + monthMatterCost;
  const incompleteCount = recipesWithCost.filter(
    (r) => r.recipe.prix_vente <= 0 || r.recipe.forecast_quantity <= 0
  ).length;

  // Marge brute (sans les frais) vs marge nette, pour repérer d'un coup d'œil si
  // une recette a un problème de coût matière ou plutôt de poids des frais généraux.
  const marginComparisonData = priced
    .map((r) => ({
      label: r.recipe.nom,
      values: [r.breakdown.grossMarginRate, r.breakdown.marginRate],
    }))
    .sort((a, b) => b.values[1] - a.values[1])
    .slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">Aperçu</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-brand-ink">Tableau de bord</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Vue d&apos;ensemble de vos recettes et de leur rentabilité — {MONTH_LABELS[new Date().getMonth()]}.
      </p>

      {isEmpty ? (
        <div className="mt-8 rounded-xl border border-dashed border-brand-line p-8 text-center">
          <p className="text-2xl">👋</p>
          <p className="mt-2 text-sm font-medium text-brand-ink">Bienvenue sur votre établissement</p>
          <p className="mt-1 text-sm text-brand-muted">
            Commencez par ajouter vos ingrédients, puis créez vos premières recettes pour voir
            apparaître leur coût de revient et leur marge ici.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              href={`/etablissements/${id}/ingredients`}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-brand-accent to-brand-accent-dark px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md"
            >
              Ajouter des ingrédients
            </Link>
            <Link
              href={`/etablissements/${id}/recipes`}
              className="inline-flex items-center justify-center rounded-lg border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-panel-soft"
            >
              Créer une recette
            </Link>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Recettes" value={number(recipesWithCost.length)} icon="📖" />
        <StatTile
          label="Marge moyenne"
          value={priced.length ? `${averageMarginRate.toFixed(1)}%` : "-"}
          tone={priced.length && averageMarginRate >= LOW_MARGIN_RATE ? "success" : "warning"}
          icon="📈"
        />
        <StatTile
          label="Produit le plus rentable"
          value={mostProfitable ? mostProfitable.recipe.nom : "-"}
          tone="accent"
          icon="🏆"
        />
        <StatTile
          label="Alertes marge basse"
          value={number(lowMarginCount)}
          tone={lowMarginCount > 0 ? "danger" : "success"}
          icon="⚠️"
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-brand-muted">
        Ce mois-ci (selon le prévisionnel)
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="CA prévisionnel" value={money(monthRevenue)} icon="💰" />
        <StatTile label="Frais généraux" value={money(summary.total)} icon="🏢" />
        <StatTile label="Coût total estimé" value={money(monthCost)} icon="🧾" />
        <StatTile
          label="Marge prévisionnelle"
          value={money(monthRevenue - monthCost)}
          tone={monthRevenue - monthCost >= 0 ? "success" : "danger"}
          icon="📊"
        />
        <StatTile
          label="Recettes incomplètes"
          value={incompleteCount ? number(incompleteCount) : "OK"}
          tone={incompleteCount ? "warning" : "success"}
          icon="✏️"
        />
      </div>

      {marginComparisonData.length ? (
        <div className={`mt-8 p-5 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand-ink">Marge par recette</h2>
            <Link href={`/etablissements/${id}/rapport`} className="text-xs font-medium text-brand-accent hover:underline">
              Rapport complet →
            </Link>
          </div>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            Marge brute (sans les frais) comparée à la marge nette — top recettes par taux de marge
            nette.
          </p>
          <GroupedBarChart
            series={[{ label: "Marge brute" }, { label: "Marge nette" }]}
            data={marginComparisonData}
            format="percent"
          />
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={`/etablissements/${id}/${link.href}`}
            className={`p-4 ${cardClass} ${cardHoverClass}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-panel-soft text-brand-accent-dark">
              <link.icon className="h-5 w-5" />
            </span>
            <p className="mt-2 text-sm font-semibold text-brand-ink">{link.label}</p>
            <p className="mt-0.5 text-xs text-brand-muted">{link.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-brand-ink">Vos recettes</h2>
        <Link href={`/etablissements/${id}/recipes`} className="text-sm font-medium text-brand-accent hover:underline">
          Gérer les recettes →
        </Link>
      </div>

      <div className="mt-3">
        <DashboardRecipesTable
          establishmentId={id}
          rows={recipesWithCost.map(({ recipe, breakdown }) => ({
            id: recipe.id,
            nom: recipe.nom,
            prix_vente: recipe.prix_vente,
            matterPerUnit: breakdown.matterPerUnit,
            overheadPerUnit: breakdown.overheadPerUnit,
            margin: breakdown.margin,
            marginRate: breakdown.marginRate,
            grossMargin: breakdown.grossMargin,
            grossMarginRate: breakdown.grossMarginRate,
          }))}
        />
      </div>
    </main>
  );
}
