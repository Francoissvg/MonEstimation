"use client";

import { useMemo, useState } from "react";
import { GroupedBarChart, type GroupedBarDatum } from "@/components/charts/grouped-bar-chart";
import { inputClass } from "@/lib/ui";
import { useVocabulary } from "@/components/vocabulary-provider";

export type RecipeHistorySeries = {
  recipeNom: string;
  points: { date: string; cout: number; prixVente: number }[];
};

export function PurchaseVsSaleChart({ series }: { series: RecipeHistorySeries[] }) {
  const vocab = useVocabulary();
  const [selected, setSelected] = useState(series[0]?.recipeNom ?? "");
  const current = useMemo(
    () => series.find((s) => s.recipeNom === selected) ?? series[0],
    [series, selected]
  );

  if (!series.length) {
    return (
      <p className="text-sm text-brand-muted">
        Ouvrez une {vocab.recipeLower} et cliquez sur « Enregistrer dans l&apos;historique » pour commencer à
        suivre l&apos;écart entre son coût de revient et son prix de vente dans le temps.
      </p>
    );
  }

  const data: GroupedBarDatum[] =
    current?.points.map((p) => ({
      label: new Date(p.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      values: [p.cout, p.prixVente],
    })) ?? [];

  return (
    <div className="space-y-4">
      <select
        value={current?.recipeNom}
        onChange={(event) => setSelected(event.target.value)}
        className={`${inputClass} mt-0 max-w-xs`}
      >
        {series.map((s) => (
          <option key={s.recipeNom} value={s.recipeNom}>
            {s.recipeNom}
          </option>
        ))}
      </select>

      <GroupedBarChart
        series={[{ label: "Coût de revient" }, { label: "Prix de vente" }]}
        data={data}
        format="money"
        emptyLabel={`Pas assez de calculs enregistrés pour cette ${vocab.recipeLower}.`}
      />
    </div>
  );
}
