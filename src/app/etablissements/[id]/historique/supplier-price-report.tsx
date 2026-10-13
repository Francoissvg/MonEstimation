"use client";

import { useMemo, useState } from "react";
import { moneyPrecise } from "@/lib/format";
import { tableWrapClass, tableHeadClass, tableRowClass, cardClass } from "@/lib/ui";
import { compareValues, toggleSort, type SortState } from "@/lib/sort";
import { SortHeader } from "@/components/sort-header";
import { SearchInput } from "@/components/search-input";
import { RankedBarChart, type RankedBarDatum } from "@/components/charts/ranked-bar-chart";
import { useVocabulary } from "@/components/vocabulary-provider";

export type SupplierPriceRow = {
  ingredientId: string;
  supplierId: string;
  ingredientNom: string;
  supplierNom: string;
  firstPrice: number;
  firstDate: string;
  lastPrice: number;
  lastDate: string;
  changeRate: number;
  usageUnit: string;
};

type SortKey = "ingredientNom" | "supplierNom" | "firstPrice" | "lastPrice" | "changeRate";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function SupplierPriceReport({ rows }: { rows: SupplierPriceRow[] }) {
  const vocab = useVocabulary();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "changeRate", direction: "desc" });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query
      ? rows.filter(
          (r) =>
            r.ingredientNom.toLowerCase().includes(query) || r.supplierNom.toLowerCase().includes(query)
        )
      : rows;
    return [...list].sort((a, b) => {
      const value = compareValues(a[sort.key], b[sort.key]);
      return sort.direction === "asc" ? value : -value;
    });
  }, [rows, search, sort]);

  const chartData: RankedBarDatum[] = [...rows]
    .sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate))
    .slice(0, 8)
    .map((r) => ({
      label: `${r.ingredientNom} (${r.supplierNom})`,
      value: r.changeRate,
      tone: (r.changeRate > 0 ? "critical" : "good") as "good" | "critical",
    }));

  const header = (key: SortKey, label: string) => (
    <SortHeader
      label={label}
      active={sort.key === key}
      direction={sort.direction}
      onClick={() => setSort((current) => toggleSort(current, key))}
    />
  );

  if (!rows.length) {
    return (
      <p className="text-sm text-brand-muted">
        Associez un fournisseur à au moins deux achats de {vocab.sameIngredient} (page {vocab.ingredients} →
        Historique) pour voir apparaître ce rapport.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`p-5 ${cardClass}`}>
        <h3 className="text-sm font-semibold text-brand-ink">Plus fortes variations</h3>
        <p className="mt-0.5 mb-4 text-xs text-brand-muted">
          Évolution du prix payé entre le premier et le dernier achat (rouge = hausse, vert = baisse).
        </p>
        <RankedBarChart data={chartData} format="percent" />
      </div>

      <div className="max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder={`Rechercher ${vocab.anIngredient} ou un fournisseur...`} />
      </div>

      <div className={tableWrapClass}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3">{header("ingredientNom", vocab.ingredient)}</th>
              <th className="px-4 py-3">{header("supplierNom", "Fournisseur")}</th>
              <th className="px-4 py-3">{header("firstPrice", "Premier prix")}</th>
              <th className="px-4 py-3">{header("lastPrice", "Dernier prix")}</th>
              <th className="px-4 py-3">{header("changeRate", "Variation")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((r) => (
                <tr key={`${r.ingredientId}-${r.supplierId}`} className={tableRowClass}>
                  <td className="px-4 py-3 font-medium text-brand-ink">{r.ingredientNom}</td>
                  <td className="px-4 py-3 text-brand-muted">{r.supplierNom}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {moneyPrecise(r.firstPrice)}/{r.usageUnit}
                    <span className="ml-1 text-xs">({formatDate(r.firstDate)})</span>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {moneyPrecise(r.lastPrice)}/{r.usageUnit}
                    <span className="ml-1 text-xs">({formatDate(r.lastDate)})</span>
                  </td>
                  <td
                    className={`px-4 py-3 font-semibold ${
                      r.changeRate > 0.5
                        ? "text-brand-danger"
                        : r.changeRate < -0.5
                          ? "text-brand-success"
                          : "text-brand-muted"
                    }`}
                  >
                    {r.changeRate > 0 ? "+" : ""}
                    {r.changeRate.toFixed(1)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-muted">
                  Aucun résultat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
