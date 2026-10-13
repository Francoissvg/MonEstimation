"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
import { cardClass, inputClass, tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { MONTH_LABELS, MONTH_SHORT_LABELS } from "@/lib/months";
import { useVocabulary } from "@/components/vocabulary-provider";
import { sessionFixedCost } from "@/lib/workshops";
import type { PlanningWorkshop } from "@/lib/recipe-costs.server";

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
        className="w-16 rounded border border-brand-line px-1 py-1 text-right text-base text-brand-ink disabled:opacity-60 sm:w-12 sm:py-0.5 sm:text-xs"
        title="Quantité à appliquer aux 12 mois"
      />
      <button
        type="button"
        onClick={handleApply}
        disabled={pending || !text}
        className="rounded border border-brand-line px-2 py-1.5 text-xs font-medium sm:px-1.5 sm:py-0.5 sm:text-[10px] text-brand-muted transition-colors hover:border-brand-accent hover:text-brand-accent-dark disabled:opacity-40"
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
  workshops,
  employees,
  fixedCosts,
  utilitiesByMonth,
  margeCible,
  actuals,
  actualsYear,
}: {
  establishmentId: string;
  recipes: PlanningRecipe[];
  workshops: PlanningWorkshop[];
  employees: EmployeeForCosting[];
  fixedCosts: FixedCostForCosting[];
  utilitiesByMonth: number[];
  margeCible: number;
  actuals: Record<string, number[]>;
  actualsYear: number;
}) {
  const vocab = useVocabulary();
  const [forecasts, setForecasts] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(recipes.map((r) => [r.id, [...r.monthlyForecasts]]))
  );
  const [realised, setRealised] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(recipes.map((r) => [r.id, [...(actuals[r.id] ?? new Array(12).fill(0))]]))
  );
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const monthBarRef = useRef<HTMLDivElement>(null);

  // Sur téléphone, la barre des mois défile : on centre le mois choisi pour qu'il reste visible.
  useEffect(() => {
    const bar = monthBarRef.current;
    const button = bar?.children[selectedMonth] as HTMLElement | undefined;
    if (!bar || !button || bar.scrollWidth <= bar.clientWidth) return;
    bar.scrollLeft = button.offsetLeft - bar.clientWidth / 2 + button.clientWidth / 2;
  }, [selectedMonth]);

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
      // Les ateliers absorbent aussi leur part des frais (même logique que côté serveur,
      // voir getMonthCostContext) : un "produit" par participant, portions = 1.
      const workshopInputs: RecipeOverheadInput[] = workshops.map((w) => ({
        id: `workshop:${w.id}`,
        prixVente: w.prix_participant,
        portions: 1,
        forecastQuantity: (w.monthlySessions[monthIndex] ?? 0) * (w.monthlyParticipants[monthIndex] ?? 0),
      }));
      const overheadByRecipe = allocateOverhead([...overheadInputs, ...workshopInputs], summary.total);

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

      const workshopRows = workshops.map((w) => {
        const sessions = w.monthlySessions[monthIndex] ?? 0;
        const participants = w.monthlyParticipants[monthIndex] ?? 0;
        const totalParticipants = sessions * participants;
        const revenue = totalParticipants * w.prix_participant;
        const matter = totalParticipants * w.kitCost;
        // "Frais" = frais de séance (animation, divers) + quote-part de frais généraux.
        const overhead =
          sessions * sessionFixedCost(w) + totalParticipants * (overheadByRecipe.get(`workshop:${w.id}`) ?? 0);
        const margin = revenue - matter - overhead;
        return {
          id: w.id,
          nom: w.nom,
          sessions,
          participants,
          revenue,
          matter,
          overhead,
          margin,
          rate: revenue > 0 ? (margin / revenue) * 100 : 0,
        };
      });

      const totals = [...rows, ...workshopRows].reduce(
        (acc, row) => ({
          revenue: acc.revenue + row.revenue,
          matter: acc.matter + row.matter,
          overhead: acc.overhead + row.overhead,
          margin: acc.margin + row.margin,
        }),
        { revenue: 0, matter: 0, overhead: 0, margin: 0 }
      );

      const workshopParticipants = workshopRows.reduce((sum, w) => sum + w.sessions * w.participants, 0);
      return {
        summary,
        rows,
        workshopRows,
        totals,
        forecastFilled: totalPartsForecast > 0 || workshopParticipants > 0,
      };
    });
  }, [recipes, workshops, forecasts, realised, employees, fixedCosts, utilitiesByMonth, margeCible]);

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
      {/* Téléphone : la grille 12 mois est trop large, la saisie se fait mois par mois plus bas. */}
      <p className="rounded-xl border border-brand-line bg-brand-panel-soft/60 p-4 text-sm text-brand-muted md:hidden">
        Choisissez un mois ci-dessous puis saisissez les quantités prévues et réalisées de chaque{" "}
        {vocab.recipeLower}. « Toute l&apos;année » applique la même quantité aux 12 mois.
      </p>

      <section className="hidden md:block">
        <h2 className="text-lg font-semibold tracking-tight text-brand-ink">Grille de saisie</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Renseignez le prévisionnel de chaque {vocab.recipeLower} pour chaque mois — utile pour
          anticiper les écarts saisonniers (ex : {vocab.seasonalExample}). Pour une quantité stable
          toute l&apos;année, utilisez le champ &quot;Tout l&apos;an&quot; sous le nom de la{" "}
          {vocab.recipeLower}.
        </p>
        <div className={`mt-4 ${tableWrapClass}`}>
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className="sticky left-0 bg-brand-panel-soft/70 px-4 py-3">{vocab.recipe}</th>
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
                    Aucune {vocab.recipeLower} pour l&apos;instant.
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
        {workshops.length ? (
          <p className="mt-2 text-sm text-brand-muted">
            Le prévisionnel des ateliers (séances et participants) se saisit sur la fiche de chaque{" "}
            <Link href={`/etablissements/${establishmentId}/ateliers`} className="underline">
              atelier
            </Link>
            . Ils sont inclus dans le détail du mois ci-dessous.
          </p>
        ) : null}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-brand-ink">Détail du mois</h2>
        </div>
        <div
          ref={monthBarRef}
          className="relative mt-3 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-brand-line bg-brand-panel-soft/60 p-1 md:inline-flex md:flex-wrap"
        >
          {MONTH_SHORT_LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedMonth(i)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-all md:py-1.5 ${
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
            label={`${vocab.recipes} incomplètes`}
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

        <ul className="mt-4 space-y-3 md:hidden">
          {current.rows.map((row) => {
            const forecastValue = forecasts[row.id]?.[selectedMonth] ?? 0;
            const actualValue = realised[row.id]?.[selectedMonth] ?? 0;
            return (
              <li key={row.id} className={`p-4 ${cardClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/etablissements/${establishmentId}/recipes/${row.id}`}
                    className="min-w-0 font-medium text-brand-ink hover:text-brand-accent hover:underline"
                  >
                    {row.nom}
                  </Link>
                  <span
                    className={`shrink-0 text-sm font-medium ${
                      row.revenue > 0 && row.rate < 60 ? "text-brand-danger" : "text-brand-success"
                    }`}
                  >
                    {row.revenue > 0 ? `${row.rate.toFixed(1)}%` : "-"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="text-xs font-medium text-brand-muted">
                    Prévu
                    <MonthValueCell
                      key={`m-forecast-${row.id}-${selectedMonth}-${forecastValue}`}
                      value={forecastValue}
                      onChange={(value) => setCell(row.id, selectedMonth, value)}
                      commit={(value) => updateMonthlyForecast(row.id, establishmentId, selectedMonth + 1, value)}
                      width="w-full"
                    />
                  </label>
                  <label className="text-xs font-medium text-brand-muted">
                    Réalisé ({actualsYear})
                    <MonthValueCell
                      key={`m-actual-${row.id}-${selectedMonth}-${actualValue}`}
                      value={actualValue}
                      onChange={(value) => setRealisedCell(row.id, selectedMonth, value)}
                      commit={(value) =>
                        updateMonthlyActual(row.id, establishmentId, actualsYear, selectedMonth + 1, value)
                      }
                      width="w-full"
                    />
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-brand-muted">
                    CA {row.priced ? money(row.revenue) : "non rempli"} · Marge {money(row.margin)}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
                    Toute l&apos;année :
                    <RowFillControl onApply={(value) => applyToAllMonths(row.id, value)} />
                  </span>
                </div>
              </li>
            );
          })}
          {current.workshopRows.map((row) => (
            <li key={`m-workshop-${row.id}`} className={`p-4 ${cardClass}`}>
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/etablissements/${establishmentId}/ateliers/${row.id}`}
                  className="min-w-0 font-medium text-brand-ink hover:text-brand-accent hover:underline"
                >
                  {row.nom}
                </Link>
                <span className="shrink-0 rounded bg-brand-panel-soft px-1.5 py-0.5 text-[10px] font-medium uppercase text-brand-muted">
                  Atelier
                </span>
              </div>
              <p className="mt-2 text-sm text-brand-muted">
                {number(row.sessions)} séance(s) × {number(row.participants)} participant(s)
              </p>
              <p className="text-xs text-brand-muted">
                CA {money(row.revenue)} · Marge {money(row.margin)}
              </p>
            </li>
          ))}
          {!current.rows.length && !current.workshopRows.length ? (
            <li className="rounded-xl border border-dashed border-brand-line p-8 text-center text-sm text-brand-muted">
              Aucune {vocab.recipeLower} pour l&apos;instant.
            </li>
          ) : null}
        </ul>

        <div className={`mt-4 hidden md:block ${tableWrapClass}`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-4 py-3">{vocab.recipe}</th>
                <th className="px-4 py-3">Prévisionnel</th>
                <th className="px-4 py-3">Réalisé ({actualsYear})</th>
                <th className="px-4 py-3">Écart</th>
                <th className="px-4 py-3">CA</th>
                <th className="px-4 py-3">{vocab.matterCost}</th>
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
              ) : null}
              {current.workshopRows.map((row) => (
                <tr key={`workshop-${row.id}`} className={tableRowClass}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/etablissements/${establishmentId}/ateliers/${row.id}`}
                      className="font-medium text-brand-ink hover:text-brand-accent hover:underline"
                    >
                      {row.nom}
                    </Link>
                    <span className="ml-2 rounded bg-brand-panel-soft px-1.5 py-0.5 text-[10px] font-medium uppercase text-brand-muted">
                      Atelier
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {number(row.sessions)} séance(s) × {number(row.participants)}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">-</td>
                  <td className="px-4 py-3 text-brand-muted">-</td>
                  <td className="px-4 py-3 text-brand-muted">{money(row.revenue)}</td>
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
              ))}
              {!current.rows.length && !current.workshopRows.length ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-brand-muted">
                    Aucune {vocab.recipeLower} pour l&apos;instant.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-sm text-brand-muted">
        Les besoins en approvisionnement (quantité de {vocab.ingredientsLower} nécessaire pour le mois) sont
        désormais dans le{" "}
        <Link href={`/etablissements/${establishmentId}/rapport`} className="underline">
          Rapport
        </Link>
        .
      </p>
    </div>
  );
}
