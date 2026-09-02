"use client";

import { useState } from "react";
import { MultiLineChart, type MultiLineSeries } from "@/components/charts/multi-line-chart";
import { CATEGORICAL_COLORS } from "@/lib/chart-colors";
import { money } from "@/lib/format";

export type IngredientPriceHistory = {
  ingredientId: string;
  nom: string;
  unit: string; // unité d'affichage (kg, l, pièce)
  points: { date: string; price: number }[]; // triés chronologiquement
};

export function PriceEvolutionChart({ histories }: { histories: IngredientPriceHistory[] }) {
  const eligible = histories.filter((h) => h.points.length >= 2);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    eligible.slice(0, 1).map((h) => h.ingredientId)
  );

  if (!eligible.length) {
    return (
      <p className="text-sm text-brand-muted">
        Enregistrez au moins deux achats pour un même ingrédient (page Ingrédients → Historique)
        pour voir son évolution de prix ici.
      </p>
    );
  }

  const toggle = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
  };

  const withChange = eligible.map((h, i) => {
    const first = h.points[0].price;
    const last = h.points[h.points.length - 1].price;
    const changeRate = first > 0 ? ((last - first) / first) * 100 : 0;
    return { ...h, changeRate, color: CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length] };
  });

  const selected = withChange.filter((h) => selectedIds.includes(h.ingredientId));

  const series: MultiLineSeries[] = selected.map((h) => {
    const first = h.points[0].price;
    return {
      id: h.ingredientId,
      label: `${h.nom} (${h.changeRate >= 0 ? "+" : ""}${h.changeRate.toFixed(1)}%)`,
      color: h.color,
      points: h.points.map((p) => ({
        date: p.date,
        value: first > 0 ? ((p.price - first) / first) * 100 : 0,
      })),
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {withChange.map((h) => {
          const active = selectedIds.includes(h.ingredientId);
          return (
            <button
              key={h.ingredientId}
              type="button"
              onClick={() => toggle(h.ingredientId)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-brand-accent bg-brand-accent/10 text-brand-accent-dark"
                  : "border-brand-line text-brand-muted hover:border-brand-accent/40"
              }`}
            >
              {h.nom}{" "}
              <span
                className={
                  h.changeRate > 0.5
                    ? "text-brand-danger"
                    : h.changeRate < -0.5
                      ? "text-brand-success"
                      : "text-brand-muted"
                }
              >
                ({h.changeRate >= 0 ? "+" : ""}
                {h.changeRate.toFixed(1)}%)
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-brand-muted">
        Courbes indexées en % d&apos;évolution depuis le premier achat, pour comparer plusieurs
        produits même à des prix très différents.
      </p>

      <MultiLineChart series={series} format="percent" />

      {selected.length ? (
        <p className="text-xs text-brand-muted">
          Prix de départ :{" "}
          {selected.map((h, i) => (
            <span key={h.ingredientId}>
              {i > 0 ? " · " : ""}
              {h.nom} {money(h.points[0].price)}/{h.unit}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
