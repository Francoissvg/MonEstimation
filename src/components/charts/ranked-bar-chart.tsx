"use client";

import { STATUS_COLORS } from "@/lib/chart-colors";
import { formatChartValue, type ChartValueFormat } from "@/lib/chart-format";

export type RankedBarDatum = {
  label: string;
  value: number;
  tone?: "good" | "critical";
};

export function RankedBarChart({
  data,
  format,
  emptyLabel = "Pas encore de données.",
}: {
  data: RankedBarDatum[];
  format: ChartValueFormat;
  emptyLabel?: string;
}) {
  if (!data.length) {
    return <p className="text-sm text-brand-muted">{emptyLabel}</p>;
  }

  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);

  return (
    <div className="space-y-2.5">
      {data.map((d) => {
        const pct = Math.max((Math.abs(d.value) / max) * 100, 2);
        const color = d.tone === "critical" ? STATUS_COLORS.critical : d.tone === "good" ? STATUS_COLORS.good : "#0a89a6";
        return (
          <div
            key={d.label}
            className="group flex items-center gap-3 rounded-md px-1 py-0.5 transition-colors hover:bg-brand-panel-soft/60"
          >
            <div className="w-32 shrink-0 truncate text-sm text-brand-ink sm:w-40" title={d.label}>
              {d.label}
            </div>
            <div className="h-5 flex-1 rounded-sm bg-brand-panel-soft">
              <div
                className="h-5 rounded-r-sm transition-[width]"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <div className="w-16 shrink-0 text-right text-sm tabular-nums text-brand-muted">
              {formatChartValue(format, d.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
