"use client";

import { useMemo, useState } from "react";
import { CHART_INK } from "@/lib/chart-colors";
import { formatChartValue, type ChartValueFormat } from "@/lib/chart-format";
import { ChartLegend } from "./legend";

export type MultiLinePoint = { date: string; value: number };
export type MultiLineSeries = { id: string; label: string; color: string; points: MultiLinePoint[] };

const WIDTH = 600;
const HEIGHT = 240;
const PAD_LEFT = 48;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 20;

// Plusieurs courbes sur un même graphique, positionnées par date réelle (et non
// par simple position d'index) pour rester correctes même si chaque série a des
// points à des dates différentes.
export function MultiLineChart({
  series,
  format,
  emptyLabel = "Sélectionnez au moins un produit ayant au moins deux achats enregistrés.",
}: {
  series: MultiLineSeries[];
  format: ChartValueFormat;
  emptyLabel?: string;
}) {
  const [hover, setHover] = useState<{ seriesId: string; index: number } | null>(null);
  const usable = useMemo(() => series.filter((s) => s.points.length >= 2), [series]);

  const { seriesCoords, minY, maxY } = useMemo(() => {
    if (!usable.length) return { seriesCoords: [], minY: 0, maxY: 0 };

    const allPoints = usable.flatMap((s) => s.points);
    const timestamps = allPoints.map((p) => new Date(p.date).getTime());
    const minT = Math.min(...timestamps);
    const maxT = Math.max(...timestamps);
    const values = allPoints.map((p) => p.value);
    const rawMin = Math.min(...values, 0);
    const rawMax = Math.max(...values, 0);
    const span = rawMax - rawMin || 1;
    const minY = rawMin - span * 0.1;
    const maxY = rawMax + span * 0.1;

    const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
    const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

    const seriesCoords = usable.map((s) => ({
      id: s.id,
      label: s.label,
      color: s.color,
      coords: s.points.map((p) => {
        const t = new Date(p.date).getTime();
        const x = PAD_LEFT + (maxT === minT ? innerWidth / 2 : ((t - minT) / (maxT - minT)) * innerWidth);
        const y = PAD_TOP + innerHeight - ((p.value - minY) / (maxY - minY || 1)) * innerHeight;
        return { x, y, date: p.date, value: p.value };
      }),
    }));

    return { seriesCoords, minY, maxY };
  }, [usable]);

  if (!usable.length) {
    return <p className="text-sm text-brand-muted">{emptyLabel}</p>;
  }

  const innerHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const yTicks = [minY, (minY + maxY) / 2, maxY];
  const hoveredSeries = hover ? seriesCoords.find((s) => s.id === hover.seriesId) : null;
  const hoveredPoint = hoveredSeries && hover ? hoveredSeries.coords[hover.index] : null;

  return (
    <div className="space-y-3">
      <ChartLegend items={seriesCoords.map((s) => ({ label: s.label, color: s.color }))} />
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label="Évolution comparée"
          onMouseLeave={() => setHover(null)}
        >
          {yTicks.map((tick, i) => {
            const y = PAD_TOP + innerHeight - ((tick - minY) / (maxY - minY || 1)) * innerHeight;
            return (
              <g key={i}>
                <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke={CHART_INK.grid} strokeWidth={1} />
                <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" fontSize={10} fill={CHART_INK.muted}>
                  {formatChartValue(format, tick)}
                </text>
              </g>
            );
          })}
          <line
            x1={PAD_LEFT}
            x2={WIDTH - PAD_RIGHT}
            y1={PAD_TOP + innerHeight - ((0 - minY) / (maxY - minY || 1)) * innerHeight}
            y2={PAD_TOP + innerHeight - ((0 - minY) / (maxY - minY || 1)) * innerHeight}
            stroke={CHART_INK.baseline}
            strokeWidth={1}
          />

          {seriesCoords.map((s) => (
            <g key={s.id}>
              <path
                d={s.coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {s.coords.map((c, i) => (
                <g key={i}>
                  <circle cx={c.x} cy={c.y} r={3.5} fill={s.color} stroke="#ffffff" strokeWidth={1.5} />
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={10}
                    fill="transparent"
                    onMouseEnter={() => setHover({ seriesId: s.id, index: i })}
                    onFocus={() => setHover({ seriesId: s.id, index: i })}
                    tabIndex={0}
                  />
                </g>
              ))}
            </g>
          ))}
        </svg>

        {hoveredPoint && hoveredSeries ? (
          <div
            className="pointer-events-none absolute rounded-md border border-brand-line bg-white px-2.5 py-1.5 text-xs shadow-md"
            style={{
              left: `${(hoveredPoint.x / WIDTH) * 100}%`,
              top: `${(hoveredPoint.y / HEIGHT) * 100}%`,
              transform: "translate(-50%, -130%)",
            }}
          >
            <p className="text-brand-muted">
              {hoveredSeries.label} ·{" "}
              {new Date(hoveredPoint.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
            </p>
            <p className="font-semibold text-brand-ink">{formatChartValue(format, hoveredPoint.value)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
