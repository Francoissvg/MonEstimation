import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  currentMonth,
  currentYear,
  getAnnualRevenueForecast,
  getForecastVsActualData,
  getMonthlyCostsSummary,
  getRecipesWithCost,
  getStockNeeds,
  type RecipeForCosting,
} from "@/lib/recipe-costs.server";
import { pricePerUsageUnit, baseUnitFor, toDisplayUnitPrice, formatBaseQuantity } from "@/lib/units";
import { cardClass, tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { money, number } from "@/lib/format";
import { MONTH_LABELS, MONTH_SHORT_LABELS } from "@/lib/months";
import { StatTile } from "@/components/stat-tile";
import { DonutChart } from "@/components/charts/donut-chart";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { PriceEvolutionChart, type IngredientPriceHistory } from "./price-evolution-chart";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { ExportExcelButton, type RapportExportData } from "./export-excel-button";
import type { CostBreakdown } from "@/lib/costing";

// Le coût total du mois doit toujours inclure l'intégralité des frais généraux
// (overheadTotal, payés que les recettes aient un prévisionnel ou non) plus le
// coût matière de TOUTES les recettes prévisionnalisées — y compris celles sans
// prix de vente, qui consomment quand même des ingrédients si elles sont produites.
// Ne pas se limiter aux recettes prévisionnalisées ET tarifées, sous peine de
// sous-estimer le coût réel dès qu'une recette n'a pas encore de prix de vente.
function totalsFromRecipes(
  recipesWithCost: { recipe: RecipeForCosting; breakdown: CostBreakdown }[],
  overheadTotal: number
) {
  const matterCost = recipesWithCost.reduce((sum, r) => {
    if (r.recipe.forecast_quantity <= 0) return sum;
    return sum + r.recipe.forecast_quantity * r.breakdown.matter;
  }, 0);
  const revenue = recipesWithCost.reduce((sum, r) => {
    if (r.recipe.prix_vente <= 0 || r.recipe.forecast_quantity <= 0) return sum;
    return sum + r.recipe.forecast_quantity * r.recipe.portions * r.recipe.prix_vente;
  }, 0);
  const cost = overheadTotal + matterCost;
  return { revenue, cost, margin: revenue - cost };
}

function deltaLabel(curr: number, prev: number): string | undefined {
  if (prev <= 0) return undefined;
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}% vs ${MONTH_LABELS[(currentMonth() - 2 + 12) % 12].toLowerCase()}`;
}

function deltaTone(curr: number, prev: number, goodWhenUp: boolean): "success" | "warning" {
  return curr >= prev === goodWhenUp ? "success" : "warning";
}

export default async function RapportPage({
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

  const month = currentMonth();
  const prevMonth = month === 1 ? 12 : month - 1;
  const year = currentYear();

  const [
    summary,
    prevSummary,
    recipesWithCost,
    prevRecipesWithCost,
    forecastVsActual,
    annualRevenue,
    stockNeeds,
    { data: ingredients },
    { data: purchases },
  ] = await Promise.all([
    getMonthlyCostsSummary(supabase, id, month),
    getMonthlyCostsSummary(supabase, id, prevMonth),
    getRecipesWithCost(supabase, id, month),
    getRecipesWithCost(supabase, id, prevMonth),
    getForecastVsActualData(supabase, id, month, year),
    getAnnualRevenueForecast(supabase, id),
    getStockNeeds(supabase, id, month),
    supabase.from("ingredients").select("id, nom").eq("establishment_id", id),
    supabase
      .from("ingredient_purchases")
      .select("ingredient_id, purchased_at, quantity, unit, price")
      .eq("establishment_id", id)
      .order("purchased_at", { ascending: true }),
  ]);

  const currentTotals = totalsFromRecipes(recipesWithCost, summary.total);
  const prevTotals = totalsFromRecipes(prevRecipesWithCost, prevSummary.total);

  // Marge brute (sans les frais, prix de vente - coût de fabrication seul) vs
  // marge nette (avec la quote-part de frais généraux), pour comparer.
  const marginComparisonData = recipesWithCost
    .filter((r) => r.recipe.prix_vente > 0)
    .map((r) => ({
      label: r.recipe.nom,
      values: [r.breakdown.grossMarginRate, r.breakdown.marginRate],
    }))
    .sort((a, b) => b.values[0] - a.values[0]);

  // Répartition des frais généraux
  const overheadData = [
    { label: "Salaires", value: summary.salary },
    { label: "Charges fixes", value: summary.fixed },
    { label: "Énergie / eau", value: summary.utilities },
  ].filter((d) => d.value > 0);

  // CA vs coût projeté par recette (recettes avec prévisionnel renseigné)
  const projectionData = recipesWithCost
    .filter((r) => r.recipe.forecast_quantity > 0 && r.recipe.prix_vente > 0)
    .map((r) => ({
      label: r.recipe.nom,
      values: [
        r.recipe.forecast_quantity * r.recipe.portions * r.recipe.prix_vente,
        r.recipe.forecast_quantity * r.breakdown.total,
      ],
    }))
    .sort((a, b) => b.values[0] - a.values[0])
    .slice(0, 8);

  // Prévisionnel vs réalisé (cumul depuis janvier)
  const forecastVsActualData = forecastVsActual.items.map((d) => ({
    label: d.label,
    values: [d.forecast, d.actual],
  }));

  // CA prévisionnel annuel, mois par mois, avec le cumul depuis janvier en deuxième courbe
  const annualRevenueChartPoints = MONTH_SHORT_LABELS.map((label, i) => ({
    x: label,
    y: annualRevenue.byMonth[i],
  }));
  const annualRevenueCumulativePoints = MONTH_SHORT_LABELS.map((label, i) => ({
    x: label,
    y: annualRevenue.byMonth.slice(0, i + 1).reduce((sum, v) => sum + v, 0),
  }));

  // Évolution des prix d'achat par ingrédient — exprimée au kg/litre (plutôt qu'au
  // gramme/millilitre) pour rester lisible, avec la date brute pour un positionnement
  // correct sur l'axe temporel même quand plusieurs produits sont comparés.
  const nomById = new Map((ingredients ?? []).map((i) => [i.id, i.nom]));
  const grouped = new Map<string, { date: string; price: number; unit: string }[]>();
  for (const purchase of purchases ?? []) {
    const list = grouped.get(purchase.ingredient_id) ?? [];
    const basePrice = pricePerUsageUnit(purchase.quantity, purchase.unit, purchase.price);
    const { price, unit } = toDisplayUnitPrice(basePrice, baseUnitFor(purchase.unit));
    list.push({ date: purchase.purchased_at, price, unit });
    grouped.set(purchase.ingredient_id, list);
  }
  const priceHistories: IngredientPriceHistory[] = Array.from(grouped.entries())
    .filter(([, points]) => points.length >= 2)
    .map(([ingredientId, points]) => ({
      ingredientId,
      nom: nomById.get(ingredientId) ?? "Ingrédient",
      unit: points[0].unit,
      points: points.map((p) => ({ date: p.date, price: p.price })),
    }));

  const exportData: RapportExportData = {
    month: MONTH_LABELS[month - 1],
    currentTotals,
    prevTotals,
    marginByRecipe: marginComparisonData.map((d) => ({
      nom: d.label,
      tauxMargeBrute: d.values[0],
      tauxMarge: d.values[1],
    })),
    overhead: overheadData,
    caVsCout: projectionData.map((d) => ({ nom: d.label, ca: d.values[0], cout: d.values[1] })),
    forecastVsActual: forecastVsActualData.map((d) => ({
      nom: d.label,
      previsionnel: d.values[0],
      realise: d.values[1],
    })),
    annualRevenue: annualRevenueChartPoints.map((p, i) => ({
      mois: p.x,
      ca: p.y,
      cumul: annualRevenueCumulativePoints[i].y,
    })),
    stockNeeds: stockNeeds.needs.map((n) => ({
      nom: n.nom,
      quantite: formatBaseQuantity(n.quantity, n.usageUnit),
      cout: n.cost,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 print:px-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">Rapport</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Quelques vues d&apos;ensemble pour repérer les recettes à surveiller et l&apos;évolution
            de vos coûts — {MONTH_LABELS[month - 1]}.
          </p>
          <p className="mt-1 hidden text-xs text-brand-muted print:block">
            Généré le {new Date().toLocaleDateString("fr-FR")}
          </p>
          <Link
            href={`/etablissements/${id}/export`}
            className="mt-1 inline-block text-xs font-medium text-brand-accent hover:underline print:hidden"
          >
            Besoin de tout exporter (ingrédients, recettes, frais, historique...) ? →
          </Link>
        </div>
        <div className="flex shrink-0 gap-2 print:hidden">
          <ExportExcelButton data={exportData} />
          <ExportPdfButton />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="CA prévisionnel du mois"
          value={money(currentTotals.revenue)}
          icon="💰"
          delta={deltaLabel(currentTotals.revenue, prevTotals.revenue)}
          deltaTone={deltaTone(currentTotals.revenue, prevTotals.revenue, true)}
        />
        <StatTile
          label="Coût total du mois"
          value={money(currentTotals.cost)}
          icon="🧾"
          delta={deltaLabel(currentTotals.cost, prevTotals.cost)}
          deltaTone={deltaTone(currentTotals.cost, prevTotals.cost, false)}
        />
        <StatTile
          label="Marge du mois"
          value={money(currentTotals.margin)}
          tone={currentTotals.margin >= prevTotals.margin ? "success" : "warning"}
          icon="📈"
          delta={deltaLabel(currentTotals.margin, prevTotals.margin)}
          deltaTone={deltaTone(currentTotals.margin, prevTotals.margin, true)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 print:grid-cols-1">
        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">Marge par recette</h2>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            Marge brute (prix de vente - coût de fabrication seul, sans les frais) comparée à la
            marge nette (avec la quote-part de frais généraux).
          </p>
          <GroupedBarChart
            series={[{ label: "Marge brute" }, { label: "Marge nette" }]}
            data={marginComparisonData}
            format="percent"
          />
        </section>

        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">Répartition des frais généraux</h2>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            Salaires, charges fixes et énergie du mois en cours.
          </p>
          <DonutChart data={overheadData} format="money" />
        </section>

        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">CA vs coût projeté par recette</h2>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            Basé sur le prévisionnel mensuel de chaque recette (top 8).
          </p>
          <GroupedBarChart
            series={[{ label: "CA" }, { label: "Coût" }]}
            data={projectionData}
            format="number"
            emptyLabel="Renseignez un prévisionnel sur vos recettes pour voir ce graphique."
          />
        </section>

        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">Prévisionnel vs réalisé (cumul {year})</h2>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            Ventes prévues vs réellement saisies depuis janvier (page Prévisionnel, top 8 recettes).
          </p>
          <GroupedBarChart
            series={[{ label: "Prévisionnel" }, { label: "Réalisé" }]}
            data={forecastVsActualData}
            format="number"
            emptyLabel="Renseignez vos ventes réelles depuis la page Prévisionnel pour voir ce graphique."
          />
          {forecastVsActual.totalForecast > 0 ? (
            <p className="mt-3 text-xs text-brand-muted">
              Total cumulé : {number(forecastVsActual.totalActual)} vendues sur{" "}
              {number(forecastVsActual.totalForecast)} prévues (
              {Math.round((forecastVsActual.totalActual / forecastVsActual.totalForecast) * 100)}
              %).
            </p>
          ) : null}
        </section>

        <section className={`p-5 ${cardClass} lg:col-span-2 print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">Évolution du prix d&apos;achat</h2>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            Prix au kg/litre/pièce, par achat enregistré. Sélectionnez plusieurs produits pour les
            comparer.
          </p>
          <PriceEvolutionChart histories={priceHistories} />
        </section>

        <section className={`p-5 ${cardClass} lg:col-span-2 print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">Prévisionnel annuel</h2>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            CA prévisionnel par mois et cumulé depuis janvier, jusqu&apos;à {money(annualRevenue.total)}{" "}
            sur l&apos;année.
          </p>
          <LineChart
            points={annualRevenueChartPoints}
            secondaryPoints={annualRevenueCumulativePoints}
            primaryLabel="CA du mois"
            secondaryLabel="Cumulé"
            format="money"
          />
        </section>

        <section className={`p-5 ${cardClass} lg:col-span-2 print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">
            Besoins en approvisionnement — {MONTH_LABELS[month - 1]}
          </h2>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            Quantité de chaque ingrédient nécessaire pour honorer le prévisionnel du mois, toutes
            recettes confondues.
          </p>
          <div className={tableWrapClass}>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-3">Ingrédient</th>
                  <th className="px-4 py-3">Quantité nécessaire</th>
                  <th className="px-4 py-3 text-right">Coût estimé</th>
                </tr>
              </thead>
              <tbody>
                {stockNeeds.needs.length ? (
                  stockNeeds.needs.map((need) => (
                    <tr key={need.nom} className={tableRowClass}>
                      <td className="px-4 py-3 font-medium text-brand-ink">{need.nom}</td>
                      <td className="px-4 py-3 text-brand-muted">
                        {formatBaseQuantity(need.quantity, need.usageUnit)}
                      </td>
                      <td className="px-4 py-3 text-right text-brand-muted">{money(need.cost)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-brand-muted">
                      Renseignez un prévisionnel sur ce mois pour voir les besoins en ingrédients.
                    </td>
                  </tr>
                )}
              </tbody>
              {stockNeeds.needs.length ? (
                <tfoot>
                  <tr className="border-t border-brand-line bg-brand-panel-soft font-medium text-brand-ink">
                    <td className="px-4 py-2" colSpan={2}>
                      Coût matière total estimé
                    </td>
                    <td className="px-4 py-2 text-right">{money(stockNeeds.totalCost)}</td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
