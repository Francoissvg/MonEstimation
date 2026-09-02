"use client";

import { CATEGORICAL_COLORS } from "@/lib/chart-colors";
import { formatChartValue, type ChartValueFormat } from "@/lib/chart-format";
import { ChartLegend } from "./legend";

export type GroupedBarSeries = { label: string; color?: string };
export type GroupedBarDatum = { label: string; values: number[] };

export function GroupedBarChart({
  series,
  data,
  format,
  emptyLabel = "Pas encore de données.",
}: {
  series: GroupedBarSeries[];
  data: GroupedBarDatum[];
  format: ChartValueFormat;
  emptyLabel?: string;
}) {
  if (!data.length) {
    return <p className="text-sm text-brand-muted">{emptyLabel}</p>;
  }

  const colors = series.map((s, i) => s.color ?? CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]);
  const max = Math.max(...data.flatMap((d) => d.values.map(Math.abs)), 1);

  return (
    <div className="space-y-4">
      <ChartLegend items={series.map((s, i) => ({ label: s.label, color: colors[i] }))} />
      <div className="space-y-4">
        {data.map((d) => (
          <div key={d.label}>
            <p className="mb-1 truncate text-sm text-brand-ink" title={d.label}>
              {d.label}
            </p>
            <div className="space-y-1">
              {d.values.map((value, i) => {
                const pct = Math.max((Math.abs(value) / max) * 100, 1);
                return (
                  <div key={series[i]?.label ?? i} className="flex items-center gap-3">
                    <div className="h-4 flex-1 rounded-sm bg-brand-panel-soft">
                      <div
                        className="h-4 rounded-r-sm"
                        style={{ width: `${pct}%`, backgroundColor: colors[i] }}
                      />
                    </div>
                    <div className="w-20 shrink-0 text-right text-xs tabular-nums text-brand-muted">
                      {formatChartValue(format, value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
