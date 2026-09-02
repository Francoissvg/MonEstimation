"use client";

import { useId, useState } from "react";
import { CATEGORICAL_COLORS, CHART_INK } from "@/lib/chart-colors";
import { formatChartValue, type ChartValueFormat } from "@/lib/chart-format";
import { ChartLegend } from "./legend";

export type DonutDatum = { label: string; value: number };

const SIZE = 160;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  data,
  format,
  emptyLabel = "Pas encore de données.",
}: {
  data: DonutDatum[];
  format: ChartValueFormat;
  emptyLabel?: string;
}) {
  const gradientId = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (!data.length || total <= 0) {
    return <p className="text-sm text-brand-muted">{emptyLabel}</p>;
  }

  const segments = data.reduce<
    Array<DonutDatum & { color: string; dasharray: string; dashoffset: number; fraction: number }>
  >((acc, d, i) => {
    const offset = acc.reduce((sum, s) => sum + s.fraction * CIRCUMFERENCE, 0);
    const fraction = d.value / total;
    const dash = fraction * CIRCUMFERENCE;
    acc.push({
      ...d,
      color: CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length],
      dasharray: `${Math.max(dash - 2, 0)} ${CIRCUMFERENCE - dash + 2}`,
      dashoffset: -offset,
      fraction,
    });
    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-labelledby={gradientId}>
          <title id={gradientId}>Répartition</title>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={CHART_INK.grid}
            strokeWidth={STROKE}
          />
          {segments.map((s, i) => (
            <circle
              key={s.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={s.color}
              strokeWidth={STROKE}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              opacity={hovered === null || hovered === i ? 1 : 0.35}
              className="transition-opacity"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {hovered !== null ? (
            <>
              <p className="text-xs text-brand-muted">{segments[hovered].label}</p>
              <p className="text-sm font-semibold text-brand-ink">
                {Math.round(segments[hovered].fraction * 100)}%
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-brand-muted">Total</p>
              <p className="text-sm font-semibold text-brand-ink">{formatChartValue(format, total)}</p>
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <ChartLegend items={segments.map((s) => ({ label: s.label, color: s.color }))} />
        <ul className="space-y-1 text-sm">
          {segments.map((s, i) => (
            <li
              key={s.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center justify-between gap-4 text-brand-muted"
            >
              <span className="text-brand-ink">{s.label}</span>
              <span className="tabular-nums">{formatChartValue(format, s.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
