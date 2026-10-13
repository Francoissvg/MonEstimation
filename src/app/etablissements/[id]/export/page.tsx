import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pricePerUsageUnit, baseUnitFor } from "@/lib/units";
import {
  currentMonth,
  currentYear,
  getAnnualRevenueForecast,
  getForecastVsActualData,
  getMonthlyCostsSummary,
  getPlanningData,
  getRecipesWithCost,
  type RecipeForCosting,
} from "@/lib/recipe-costs.server";
import { cardClass, ghostLinkClass, tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { money, number } from "@/lib/format";
import { MONTH_LABELS, MONTH_SHORT_LABELS } from "@/lib/months";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { ExportAllExcelButton, type FullExportData } from "./export-all-excel-button";
import type { CostBreakdown } from "@/lib/costing";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";

// Le coût total du mois doit toujours inclure l'intégralité des frais généraux
// (overheadTotal) plus le coût matière de toutes les recettes prévisionnalisées,
// même sans prix de vente — sinon le total sous-estime la réalité.
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

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vocab = await getEstablishmentVocabulary(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id, nom, type")
    .eq("id", id)
    .single();

  if (!establishment) {
    notFound();
  }

  const month = currentMonth();
  const prevMonth = month === 1 ? 12 : month - 1;
  const year = currentYear();

  const [
    { data: ingredients },
    recipesWithCost,
    prevRecipesWithCost,
    summary,
    prevSummary,
    { data: employees },
    { data: fixedCosts },
    planningData,
    forecastVsActual,
    annualRevenue,
    { data: history },
    { data: purchases },
    { data: suppliers },
  ] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, nom, categorie, purchase_quantity, purchase_unit, purchase_price")
      .eq("establishment_id", id)
      .order("nom"),
    getRecipesWithCost(supabase, id, month),
    getRecipesWithCost(supabase, id, prevMonth),
    getMonthlyCostsSummary(supabase, id, month),
    getMonthlyCostsSummary(supabase, id, prevMonth),
    supabase
      .from("employees")
      .select("nom, salary_mode, hourly_rate, hours_per_week, monthly_salary, active, active_months")
      .eq("establishment_id", id)
      .order("nom"),
    supabase
      .from("fixed_costs")
      .select("nom, montant, frequence, categorie, active, active_months")
      .eq("establishment_id", id)
      .order("nom"),
    getPlanningData(supabase, id),
    getForecastVsActualData(supabase, id, month, year),
    getAnnualRevenueForecast(supabase, id),
    supabase
      .from("cost_history")
      .select("recipe_nom, calculated_at, cout_revient_unitaire, prix_vente, marge, taux_marge")
      .eq("establishment_id", id)
      .order("calculated_at", { ascending: false })
      .limit(200),
    supabase
      .from("ingredient_purchases")
      .select("ingredient_id, supplier_id, purchased_at, quantity, unit, price")
      .eq("establishment_id", id)
      .order("purchased_at", { ascending: true }),
    supabase.from("suppliers").select("id, nom").eq("establishment_id", id),
  ]);

  const currentTotals = totalsFromRecipes(recipesWithCost, summary.total);
  const prevTotals = totalsFromRecipes(prevRecipesWithCost, prevSummary.total);

  const ingredientRows = (ingredients ?? []).map((ing) => ({
    ...ing,
    unitPrice: pricePerUsageUnit(ing.purchase_quantity, ing.purchase_unit, ing.purchase_price),
    baseUnit: baseUnitFor(ing.purchase_unit),
  }));

  const recipeRows = recipesWithCost.map(({ recipe, breakdown }) => ({
    nom: recipe.nom,
    prixVente: recipe.prix_vente,
    unitCost: breakdown.unitCost,
    margin: breakdown.margin,
    marginRate: breakdown.marginRate,
  }));

  // Rapport fournisseurs (mêmes calculs que l'onglet Historique)
  const ingredientNomById = new Map((ingredients ?? []).map((i) => [i.id, i.nom]));
  const supplierNomById = new Map((suppliers ?? []).map((s) => [s.id, s.nom]));
  const bySupplierIngredient = new Map<string, { purchased_at: string; unitPrice: number; usageUnit: string }[]>();
  for (const p of purchases ?? []) {
    if (!p.supplier_id) continue;
    const key = `${p.ingredient_id}::${p.supplier_id}`;
    const list = bySupplierIngredient.get(key) ?? [];
    list.push({
      purchased_at: p.purchased_at,
      unitPrice: pricePerUsageUnit(p.quantity, p.unit, p.price),
      usageUnit: baseUnitFor(p.unit),
    });
    bySupplierIngredient.set(key, list);
  }
  const supplierPriceRows = Array.from(bySupplierIngredient.entries())
    .map(([key, points]) => {
      const [ingredientId, supplierId] = key.split("::");
      const sorted = [...points].sort((a, b) => new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime());
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const changeRate = first.unitPrice > 0 ? ((last.unitPrice - first.unitPrice) / first.unitPrice) * 100 : 0;
      return {
        ingredientNom: ingredientNomById.get(ingredientId) ?? vocab.ingredient,
        supplierNom: supplierNomById.get(supplierId) ?? "Fournisseur",
        firstPrice: first.unitPrice,
        lastPrice: last.unitPrice,
        changeRate,
        usageUnit: first.usageUnit,
        count: sorted.length,
      };
    })
    .filter((r) => r.count >= 2)
    .sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate));

  const exportData: FullExportData = {
    establishmentNom: establishment.nom,
    month: MONTH_LABELS[month - 1],
    ingredients: ingredientRows.map((i) => ({
      nom: i.nom,
      categorie: i.categorie,
      prixAchat: i.purchase_price,
      coutUnitaire: i.unitPrice,
      unite: i.baseUnit,
    })),
    recipes: recipeRows,
    fraisGeneraux: {
      salaires: summary.salary,
      chargesFixes: summary.fixed,
      energie: summary.utilities,
      total: summary.total,
    },
    employees: (employees ?? []).map((e) => ({
      nom: e.nom,
      mode: e.salary_mode === "mensuel" ? "Mensuel" : "Horaire",
      coutMensuel: e.salary_mode === "mensuel" ? e.monthly_salary : e.hourly_rate * e.hours_per_week * 4.33,
      actif: e.active,
    })),
    fixedCosts: (fixedCosts ?? []).map((c) => ({
      nom: c.nom,
      montant: c.montant,
      frequence: c.frequence === "annuel" ? "Annuel" : "Mensuel",
      actif: c.active,
    })),
    previsionnel: planningData.recipes.map((r) => ({
      nom: r.nom,
      parMois: r.monthlyForecasts,
      total: r.monthlyForecasts.reduce((sum, v) => sum + v, 0),
    })),
    rapportResume: { currentTotals, prevTotals },
    rapportPrevisionnelVsRealise: forecastVsActual.items.map((d) => ({
      nom: d.label,
      previsionnel: d.forecast,
      realise: d.actual,
    })),
    rapportAnnuel: MONTH_SHORT_LABELS.map((label, i) => ({
      mois: label,
      ca: annualRevenue.byMonth[i],
      cumul: annualRevenue.byMonth.slice(0, i + 1).reduce((sum, v) => sum + v, 0),
    })),
    historique: (history ?? []).map((h) => ({
      date: h.calculated_at,
      recette: h.recipe_nom,
      coutRevient: h.cout_revient_unitaire,
      prixVente: h.prix_vente,
      marge: h.marge,
      tauxMarge: h.taux_marge,
    })),
    fournisseurs: supplierPriceRows,
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10 print:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/etablissements/${id}`} className={`${ghostLinkClass} print:hidden`}>
            ← Tableau de bord
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">
            Export complet — {establishment.nom}
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Toutes les données chiffrées de l&apos;établissement ({vocab.ingredientsLower}, {vocab.recipesLower}, frais,
            prévisionnel, rapport, historique) en un seul document — {MONTH_LABELS[month - 1]}.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 print:hidden">
          <ExportAllExcelButton data={exportData} />
          <ExportPdfButton />
        </div>
      </div>

      <div className="mt-8 space-y-8">
        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">{vocab.ingredients} ({ingredientRows.length})</h2>
          <div className={`mt-3 ${tableWrapClass}`}>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-2">Nom</th>
                  <th className="px-4 py-2">Catégorie</th>
                  <th className="px-4 py-2">Prix d&apos;achat</th>
                  <th className="px-4 py-2">Coût unitaire</th>
                </tr>
              </thead>
              <tbody>
                {ingredientRows.map((i) => (
                  <tr key={i.id} className={tableRowClass}>
                    <td className="px-4 py-2 font-medium text-brand-ink">{i.nom}</td>
                    <td className="px-4 py-2 text-brand-muted">{i.categorie}</td>
                    <td className="px-4 py-2 text-brand-muted">{money(i.purchase_price)}</td>
                    <td className="px-4 py-2 text-brand-muted">
                      {money(i.unitPrice)}/{i.baseUnit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">{vocab.recipes} ({recipeRows.length})</h2>
          <div className={`mt-3 ${tableWrapClass}`}>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-2">{vocab.recipe}</th>
                  <th className="px-4 py-2">Prix vente / {vocab.part}</th>
                  <th className="px-4 py-2">Coût revient / {vocab.part}</th>
                  <th className="px-4 py-2">Marge / {vocab.part}</th>
                  <th className="px-4 py-2">Taux</th>
                </tr>
              </thead>
              <tbody>
                {recipeRows.map((r) => (
                  <tr key={r.nom} className={tableRowClass}>
                    <td className="px-4 py-2 font-medium text-brand-ink">{r.nom}</td>
                    <td className="px-4 py-2 text-brand-muted">{money(r.prixVente)}</td>
                    <td className="px-4 py-2 text-brand-muted">{money(r.unitCost)}</td>
                    <td className="px-4 py-2 text-brand-muted">{money(r.margin)}</td>
                    <td className="px-4 py-2 text-brand-muted">
                      {r.prixVente > 0 ? `${r.marginRate.toFixed(1)}%` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">Frais généraux — {MONTH_LABELS[month - 1]}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-brand-muted">Salaires</p>
              <p className="font-semibold text-brand-ink">{money(summary.salary)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-muted">Charges fixes</p>
              <p className="font-semibold text-brand-ink">{money(summary.fixed)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-muted">Énergie</p>
              <p className="font-semibold text-brand-ink">{money(summary.utilities)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-muted">Total mensuel</p>
              <p className="font-semibold text-brand-ink">{money(summary.total)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className={tableWrapClass}>
              <table className="w-full text-left text-sm">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-4 py-2">Salarié</th>
                    <th className="px-4 py-2">Coût mensuel</th>
                  </tr>
                </thead>
                <tbody>
                  {(employees ?? []).map((e) => (
                    <tr key={e.nom} className={tableRowClass}>
                      <td className="px-4 py-2 text-brand-ink">
                        {e.nom} {!e.active ? "(inactif)" : ""}
                      </td>
                      <td className="px-4 py-2 text-brand-muted">
                        {money(e.salary_mode === "mensuel" ? e.monthly_salary : e.hourly_rate * e.hours_per_week * 4.33)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={tableWrapClass}>
              <table className="w-full text-left text-sm">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-4 py-2">Charge fixe</th>
                    <th className="px-4 py-2">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {(fixedCosts ?? []).map((c) => (
                    <tr key={c.nom} className={tableRowClass}>
                      <td className="px-4 py-2 text-brand-ink">
                        {c.nom} {!c.active ? "(inactif)" : ""}
                      </td>
                      <td className="px-4 py-2 text-brand-muted">
                        {money(c.montant)} {c.frequence === "annuel" ? "/an" : "/mois"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">Prévisionnel mensuel par {vocab.recipeLower}</h2>
          <div className={`mt-3 ${tableWrapClass}`}>
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-2">{vocab.recipe}</th>
                  {MONTH_SHORT_LABELS.map((label) => (
                    <th key={label} className="px-2 py-2 text-center">
                      {label}
                    </th>
                  ))}
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {planningData.recipes.map((r) => {
                  const total = r.monthlyForecasts.reduce((sum, v) => sum + v, 0);
                  return (
                    <tr key={r.id} className={tableRowClass}>
                      <td className="px-4 py-2 font-medium text-brand-ink">{r.nom}</td>
                      {r.monthlyForecasts.map((v, i) => (
                        <td key={i} className="px-2 py-2 text-center text-brand-muted">
                          {number(v)}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right text-brand-muted">{number(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">Rapport — Résumé du mois</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-brand-muted">CA prévisionnel</p>
              <p className="font-semibold text-brand-ink">{money(currentTotals.revenue)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-muted">Coût total</p>
              <p className="font-semibold text-brand-ink">{money(currentTotals.cost)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-muted">Marge</p>
              <p className="font-semibold text-brand-ink">{money(currentTotals.margin)}</p>
            </div>
          </div>

          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Prévisionnel vs réalisé (cumul {year})
          </h3>
          <div className={`mt-2 ${tableWrapClass}`}>
            <table className="w-full text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-2">{vocab.recipe}</th>
                  <th className="px-4 py-2">Prévisionnel</th>
                  <th className="px-4 py-2">Réalisé</th>
                </tr>
              </thead>
              <tbody>
                {forecastVsActual.items.map((d) => (
                  <tr key={d.label} className={tableRowClass}>
                    <td className="px-4 py-2 text-brand-ink">{d.label}</td>
                    <td className="px-4 py-2 text-brand-muted">{number(d.forecast)}</td>
                    <td className="px-4 py-2 text-brand-muted">{number(d.actual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Prévisionnel annuel
          </h3>
          <div className={`mt-2 ${tableWrapClass}`}>
            <table className="w-full text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-2">Mois</th>
                  <th className="px-4 py-2">CA du mois</th>
                  <th className="px-4 py-2">Cumul</th>
                </tr>
              </thead>
              <tbody>
                {MONTH_SHORT_LABELS.map((label, i) => (
                  <tr key={label} className={tableRowClass}>
                    <td className="px-4 py-2 text-brand-ink">{label}</td>
                    <td className="px-4 py-2 text-brand-muted">{money(annualRevenue.byMonth[i])}</td>
                    <td className="px-4 py-2 text-brand-muted">
                      {money(annualRevenue.byMonth.slice(0, i + 1).reduce((sum, v) => sum + v, 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">Historique — Rapport fournisseurs</h2>
          <div className={`mt-3 ${tableWrapClass}`}>
            <table className="w-full text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-2">{vocab.ingredient}</th>
                  <th className="px-4 py-2">Fournisseur</th>
                  <th className="px-4 py-2">Premier prix</th>
                  <th className="px-4 py-2">Dernier prix</th>
                  <th className="px-4 py-2">Variation</th>
                </tr>
              </thead>
              <tbody>
                {supplierPriceRows.map((r, i) => (
                  <tr key={i} className={tableRowClass}>
                    <td className="px-4 py-2 text-brand-ink">{r.ingredientNom}</td>
                    <td className="px-4 py-2 text-brand-muted">{r.supplierNom}</td>
                    <td className="px-4 py-2 text-brand-muted">
                      {money(r.firstPrice)}/{r.usageUnit}
                    </td>
                    <td className="px-4 py-2 text-brand-muted">
                      {money(r.lastPrice)}/{r.usageUnit}
                    </td>
                    <td className="px-4 py-2 text-brand-muted">
                      {r.changeRate >= 0 ? "+" : ""}
                      {r.changeRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`p-5 ${cardClass} print:break-inside-avoid`}>
          <h2 className="text-sm font-semibold text-brand-ink">
            Historique — Calculs enregistrés ({(history ?? []).length})
          </h2>
          <div className={`mt-3 ${tableWrapClass}`}>
            <table className="w-full text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">{vocab.recipe}</th>
                  <th className="px-4 py-2">Coût revient</th>
                  <th className="px-4 py-2">Prix vente</th>
                  <th className="px-4 py-2">Marge</th>
                  <th className="px-4 py-2">Taux</th>
                </tr>
              </thead>
              <tbody>
                {(history ?? []).map((h, i) => (
                  <tr key={i} className={tableRowClass}>
                    <td className="px-4 py-2 text-brand-muted">
                      {new Date(h.calculated_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-2 text-brand-ink">{h.recipe_nom}</td>
                    <td className="px-4 py-2 text-brand-muted">{money(h.cout_revient_unitaire)}</td>
                    <td className="px-4 py-2 text-brand-muted">{money(h.prix_vente)}</td>
                    <td className="px-4 py-2 text-brand-muted">{money(h.marge)}</td>
                    <td className="px-4 py-2 text-brand-muted">{h.taux_marge.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
