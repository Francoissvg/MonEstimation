"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { updateMonthlyForecast, updateMonthlyActual } from "../recipes/actions";
import {
  allocateOverhead,
  isActiveInMonth,
  monthlyCostsSummary,
  recipeCostBreakdown,
  type EmployeeForCosting,
  type FixedCostForCosting,
  type RecipeOverheadInput,
} from "@/lib/costing";
import { StatTile } from "@/components/stat-tile";
import { money, number } from "@/lib/format";
import { inputClass, tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { MONTH_LABELS, MONTH_SHORT_LABELS } from "@/lib/months";

export type PlanningIngredientNeed = {
  ingredientId: string;
  nom: string;
  quantityPerBatch: number;
  usageUnit: string;
  unitPrice: number;
};

export type PlanningRecipe = {
  id: string;
  nom: string;
  portions: number;
  prixVente: number;
  matterPerBatch: number;
  monthlyForecasts: number[]; // 12 valeurs, index 0 = janvier
  ingredients: PlanningIngredientNeed[];
};

// Cellule de saisie générique : affiche `value`, et appelle `commit` (enveloppé dans une
// transition) quand la saisie change au blur. Utilisée pour le prévisionnel et le réalisé.
function MonthValueCell({
  value,
  onChange,
  commit,
  width = "w-16",
}: {
  value: number;
  onChange: (value: number) => void;
  commit: (value: number) => void;
  width?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(String(value));

  const handleBlur = () => {
    const normalized = text.trim().replace(",", ".");
    const parsed = Number(normalized);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : value;
    setText(String(next));
    if (next !== value) {
      onChange(next);
      startTransition(() => commit(next));
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      disabled={pending}
      onChange={(event) => setText(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={handleBlur}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={`${inputClass} mt-0 ${width} text-right disabled:opacity-60`}
    />
  );
}

// Petit contrôle à côté du nom de la recette : saisir une valeur puis l'appliquer
// aux 12 mois d'un coup, pour les recettes vendues en quantité stable toute l'année.
function RowFillControl({ onApply }: { onApply: (value: number) => void }) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");

  const handleApply = () => {
    const normalized = text.trim().replace(",", ".");
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    startTransition(() => onApply(parsed));
  };

  return (
    <span className="inline-flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        inputMode="decimal"
        placeholder="Qté"
        value={text}
        disabled={pending}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleApply();
          }
        }}
        className="w-12 rounded border border-brand-line px-1 py-0.5 text-right text-xs text-brand-ink disabled:opacity-60"
        title="Quantité à appliquer aux 12 mois"
      />
      <button
        type="button"
        onClick={handleApply}
        disabled={pending || !text}
        className="rounded border border-brand-line px-1.5 py-0.5 text-[10px] font-medium text-brand-muted transition-colors hover:border-brand-accent hover:text-brand-accent-dark disabled:opacity-40"
        title="Appliquer cette quantité aux 12 mois"
      >
        Tout l&apos;an
      </button>
    </span>
  );
}

export function PlanningView({
  establishmentId,
  recipes,
  employees,
  fixedCosts,
  utilitiesByMonth,
  margeCible,
  actuals,
  actualsYear,
}: {
  establishmentId: string;
  recipes: PlanningRecipe[];
  employees: EmployeeForCosting[];
  fixedCosts: FixedCostForCosting[];
  utilitiesByMonth: number[];
  margeCible: number;
  actuals: Record<string, number[]>;
  actualsYear: number;
}) {
  const [forecasts, setForecasts] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(recipes.map((r) => [r.id, [...r.monthlyForecasts]]))
  );
  const [realised, setRealised] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(recipes.map((r) => [r.id, [...(actuals[r.id] ?? new Array(12).fill(0))]]))
  );
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11

  const setCell = (recipeId: string, monthIndex: number, value: number) => {
    setForecasts((current) => {
      const next = { ...current, [recipeId]: [...current[recipeId]] };
      next[recipeId][monthIndex] = value;
      return next;
    });
  };

  // Applique la même quantité aux 12 mois d'une recette d'un coup — utile quand le
  // prévisionnel est stable toute l'année plutôt que saisi mois par mois.
  const applyToAllMonths = (recipeId: string, value: number) => {
    setForecasts((current) => ({ ...current, [recipeId]: new Array(12).fill(value) }));
    for (let m = 1; m <= 12; m++) {
      updateMonthlyForecast(recipeId, establishmentId, m, value);
    }
  };

  const setRealisedCell = (recipeId: string, monthIndex: number, value: number) => {
    setRealised((current) => {
      const next = { ...current, [recipeId]: [...current[recipeId]] };
      next[recipeId][monthIndex] = value;
      return next;
    });
  };

  // Résumé + coût par recette, calculé pour chacun des 12 mois. Les frais généraux
  // sont répartis entre les recettes au prorata de leur CA prévisionnel (allocateOverhead).
  const monthlyResults = useMemo(() => {
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const month = monthIndex + 1;
      const activeEmployees = employees.filter((e) => isActiveInMonth(e.active_months, month));
      const activeFixedCosts = fixedCosts.filter((c) => isActiveInMonth(c.active_months, month));

      const overheadInputs: RecipeOverheadInput[] = recipes.map((r) => ({
        id: r.id,
        prixVente: r.prixVente,
        portions: r.portions,
        forecastQuantity: forecasts[r.id]?.[monthIndex] ?? 0,
      }));
      const totalPartsForecast = overheadInputs.reduce((sum, r) => sum + r.forecastQuantity * r.portions, 0);

      const summary = monthlyCostsSummary({
        employees: activeEmployees,
        fixedCosts: activeFixedCosts,
        utilitiesTotal: utilitiesByMonth[monthIndex] ?? 0,
        forecastQuantity: totalPartsForecast,
        margeCible,
      });
      const overheadByRecipe = allocateOverhead(overheadInputs, summary.total);

      const rows = recipes.map((r) => {
        const forecast = forecasts[r.id]?.[monthIndex] ?? 0;
        const overheadPerBatch = overheadByRecipe.get(r.id) ?? 0;
        const breakdown = recipeCostBreakdown({
          matter: r.matterPerBatch,
          overheadPerBatch,
          portions: r.portions,
          sellingPrice: r.prixVente,
          targetMarginRate: margeCible / 100,
        });
        const priced = r.prixVente > 0;
        const revenue = forecast * r.portions * r.prixVente;
        const matter = forecast * r.matterPerBatch;
        const overhead = forecast * overheadPerBatch;
        const margin = revenue - (matter + overhead);
        const actual = realised[r.id]?.[monthIndex] ?? 0;
        return {
          id: r.id,
          nom: r.nom,
          forecast,
          actual,
          revenue,
          matter,
          overhead,
          margin,
          rate: breakdown.marginRate,
          priced,
        };
      });

      const totals = rows.reduce(
        (acc, row) => ({
          revenue: acc.revenue + row.revenue,
          matter: acc.matter + row.matter,
          overhead: acc.overhead + row.overhead,
          margin: acc.margin + row.margin,
        }),
        { revenue: 0, matter: 0, overhead: 0, margin: 0 }
      );

      return { summary, rows, totals, forecastFilled: totalPartsForecast > 0 };
    });
  }, [recipes, forecasts, realised, employees, fixedCosts, utilitiesByMonth, margeCible]);

  const current = monthlyResults[selectedMonth];
  const totalRate = current.totals.revenue > 0 ? (current.totals.margin / current.totals.revenue) * 100 : 0;
  const totalForecastUnits = current.rows.reduce((sum, r) => sum + r.forecast, 0);
  const totalActualUnits = current.rows.reduce((sum, r) => sum + r.actual, 0);
  const isPastOrCurrentMonth =
    actualsYear < now.getFullYear() ||
    (actualsYear === now.getFullYear() && selectedMonth <= now.getMonth());

  const missingCount = current.rows.filter((r) => r.forecast <= 0 || !r.priced).length;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-brand-ink">Grille de saisie</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Renseignez le prévisionnel de chaque recette pour chaque mois — utile pour anticiper les
          écarts saisonniers (ex : plus de mojitos l&apos;été, moins en hiver). Pour une quantité
          stable toute l&apos;année, utilisez le champ &quot;Tout l&apos;an&quot; sous le nom de la
          recette.
        </p>
        <div className={`mt-4 ${tableWrapClass}`}>
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className="sticky left-0 bg-brand-panel-soft/70 px-4 py-3">Recette</th>
                {MONTH_SHORT_LABELS.map((label) => (
                  <th key={label} className="px-2 py-3 text-center">
                    {label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => {
                const total = forecasts[recipe.id]?.reduce((s, v) => s + v, 0) ?? 0;
                return (
                  <tr key={recipe.id} className={tableRowClass}>
                    <td className="sticky left-0 bg-white px-4 py-2 font-medium text-brand-ink">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/etablissements/${establishmentId}/recipes/${recipe.id}`}
                          className="hover:text-brand-accent hover:underline"
                        >
                          {recipe.nom}
                        </Link>
                        <RowFillControl onApply={(value) => applyToAllMonths(recipe.id, value)} />
                      </div>
                    </td>
                    {MONTH_SHORT_LABELS.map((_, monthIndex) => (
                      <td key={monthIndex} className="px-1 py-1.5 text-center">
                        <MonthValueCell
                          value={forecasts[recipe.id]?.[monthIndex] ?? 0}
                          onChange={(value) => setCell(recipe.id, monthIndex, value)}
                          commit={(value) =>
                            updateMonthlyForecast(recipe.id, establishmentId, monthIndex + 1, value)
                          }
                          width="w-14"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right text-brand-muted">{number(total)}</td>
                  </tr>
                );
              })}
              {!recipes.length ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-brand-muted">
                    Aucune recette pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
            {recipes.length ? (
              <tfoot>
                <tr className="border-t border-brand-line bg-brand-panel-soft font-medium text-brand-ink">
                  <td className="sticky left-0 bg-brand-panel-soft px-4 py-2">Total</td>
                  {monthlyResults.map((m, i) => (
                    <td key={i} className="px-2 py-2 text-center">
                      {number(recipes.reduce((s, r) => s + (forecasts[r.id]?.[i] ?? 0), 0))}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">
                    {number(recipes.reduce((s, r) => s + (forecasts[r.id]?.reduce((a, b) => a + b, 0) ?? 0), 0))}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-brand-ink">Détail du mois</h2>
        </div>
        <div className="mt-3 inline-flex flex-wrap gap-1 rounded-xl border border-brand-line bg-brand-panel-soft/60 p-1">
          {MONTH_SHORT_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedMonth(i)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                selectedMonth === i
                  ? "bg-white text-brand-accent-dark shadow-sm"
                  : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-brand-muted">{MONTH_LABELS[selectedMonth]}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTile
            label="CA du mois"
            value={current.forecastFilled ? money(current.totals.revenue) : "Non rempli"}
            icon="💰"
          />
          <StatTile
            label="Marge du mois"
            value={current.forecastFilled ? money(current.totals.margin) : "-"}
            tone={current.forecastFilled && totalRate >= 60 ? "success" : "warning"}
            icon="📈"
          />
          <StatTile label="Frais généraux du mois" value={money(current.summary.total)} icon="🧾" />
          <StatTile
            label="Recettes incomplètes"
            value={missingCount ? number(missingCount) : "OK"}
            tone={missingCount ? "warning" : "success"}
            icon="⚠️"
          />
          <StatTile
            label={`Ventes réalisées (${actualsYear})`}
            value={isPastOrCurrentMonth ? number(totalActualUnits) : "À venir"}
            tone={
              !isPastOrCurrentMonth
                ? "ink"
                : totalActualUnits >= totalForecastUnits
                  ? "success"
                  : "warning"
            }
            icon="✅"
            delta={
              isPastOrCurrentMonth && totalForecastUnits > 0
                ? `${totalActualUnits >= totalForecastUnits ? "+" : ""}${Math.round(
                    ((totalActualUnits - totalForecastUnits) / totalForecastUnits) * 100
                  )}% vs prévisionnel`
                : undefined
            }
            deltaTone={totalActualUnits >= totalForecastUnits ? "success" : "warning"}
          />
        </div>

        <div className={`mt-4 ${tableWrapClass}`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-4 py-3">Recette</th>
                <th className="px-4 py-3">Prévisionnel</th>
                <th className="px-4 py-3">Réalisé ({actualsYear})</th>
                <th className="px-4 py-3">Écart</th>
                <th className="px-4 py-3">CA</th>
                <th className="px-4 py-3">Coût matière</th>
                <th className="px-4 py-3">Frais</th>
                <th className="px-4 py-3">Marge</th>
                <th className="px-4 py-3">Taux</th>
              </tr>
            </thead>
            <tbody>
              {current.rows.length ? (
                current.rows.map((row) => {
                  const gap = row.actual - row.forecast;
                  const gapRate = row.forecast > 0 ? (gap / row.forecast) * 100 : null;
                  return (
                    <tr key={row.id} className={tableRowClass}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/etablissements/${establishmentId}/recipes/${row.id}`}
                          className="font-medium text-brand-ink hover:text-brand-accent hover:underline"
                        >
                          {row.nom}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <MonthValueCell
                          key={`forecast-${row.id}-${selectedMonth}`}
                          value={forecasts[row.id]?.[selectedMonth] ?? 0}
                          onChange={(value) => setCell(row.id, selectedMonth, value)}
                          commit={(value) =>
                            updateMonthlyForecast(row.id, establishmentId, selectedMonth + 1, value)
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <MonthValueCell
                          key={`actual-${row.id}-${selectedMonth}`}
                          value={realised[row.id]?.[selectedMonth] ?? 0}
                          onChange={(value) => setRealisedCell(row.id, selectedMonth, value)}
                          commit={(value) =>
                            updateMonthlyActual(row.id, establishmentId, actualsYear, selectedMonth + 1, value)
                          }
                        />
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-medium ${
                          gapRate === null
                            ? "text-brand-muted"
                            : gap >= 0
                              ? "text-brand-success"
                              : "text-brand-danger"
                        }`}
                      >
                        {gapRate === null ? "-" : `${gap >= 0 ? "+" : ""}${Math.round(gapRate)}%`}
                      </td>
                      <td className="px-4 py-3 text-brand-muted">
                        {row.priced ? money(row.revenue) : "Non rempli"}
                      </td>
                      <td className="px-4 py-3 text-brand-muted">{money(row.matter)}</td>
                      <td className="px-4 py-3 text-brand-muted">{money(row.overhead)}</td>
                      <td className="px-4 py-3 text-brand-muted">{money(row.margin)}</td>
                      <td
                        className={`px-4 py-3 font-medium ${
                          row.revenue > 0 && row.rate < 60 ? "text-brand-danger" : "text-brand-success"
                        }`}
                      >
                        {row.revenue > 0 ? `${row.rate.toFixed(1)}%` : "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-brand-muted">
                    Aucune recette pour l&apos;instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-sm text-brand-muted">
        Les besoins en approvisionnement (quantité d&apos;ingrédients nécessaire pour le mois) sont
        désormais dans le{" "}
        <Link href={`/etablissements/${establishmentId}/rapport`} className="underline">
          Rapport
        </Link>
        .
      </p>
    </div>
  );
}
