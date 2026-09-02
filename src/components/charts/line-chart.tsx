"use client";

import { useMemo, useState } from "react";
import { CATEGORICAL_COLORS, CHART_INK, SEQUENTIAL_TEAL } from "@/lib/chart-colors";
import { formatChartValue, type ChartValueFormat } from "@/lib/chart-format";
import { ChartLegend } from "./legend";

export type LinePoint = { x: string; y: number };

const WIDTH = 600;
const HEIGHT = 220;
const PAD_LEFT = 48;
const PAD_RIGHT = 12;
const PAD_TOP_DEFAULT = 16;
const PAD_TOP_LABELED = 30;
const PAD_BOTTOM = 28;
// Au-delà de ce nombre de points, étiqueter chaque valeur deviendrait illisible —
// on garde alors le survol pour lire les valeurs exactes.
const MAX_LABELED_POINTS = 12;

const PRIMARY_COLOR = SEQUENTIAL_TEAL[500];
const SECONDARY_COLOR = CATEGORICAL_COLORS[2];

type Coord = { label: string; value: number; x: number; y: number };

export function LineChart({
  points,
  secondaryPoints,
  primaryLabel,
  secondaryLabel,
  format,
  unitSuffix = "",
  emptyLabel = "Pas assez de données pour tracer une courbe.",
}: {
  points: LinePoint[];
  secondaryPoints?: LinePoint[]; // deuxième courbe optionnelle, partageant le même axe
  primaryLabel?: string;
  secondaryLabel?: string;
  format: ChartValueFormat;
  unitSuffix?: string; // ajouté après la valeur formatée, ex: "/g"
  emptyLabel?: string;
}) {
  const valueFormat = (value: number) => `${formatChartValue(format, value)}${unitSuffix}`;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const hasSecondary = !!secondaryPoints?.length;
  const showDataLabels = points.length <= MAX_LABELED_POINTS;
  const padTop = showDataLabels ? PAD_TOP_LABELED : PAD_TOP_DEFAULT;

  const { primaryCoords, secondaryCoords, yTicks, minY, maxY } = useMemo(() => {
    if (points.length < 2) {
      return { primaryCoords: [] as Coord[], secondaryCoords: [] as Coord[], yTicks: [] as number[], minY: 0, maxY: 0 };
    }

    // Les deux courbes partagent le même axe : le calibrage doit tenir compte
    // des valeurs des deux séries, sinon l'axe ne reflète que la première.
    const allValues = [...points.map((p) => p.y), ...(secondaryPoints ?? []).map((p) => p.y)];
    const rawMin = Math.min(...allValues, 0);
    const rawMax = Math.max(...allValues);
    const span = rawMax - rawMin || rawMax || 1;
    const minY = Math.max(rawMin - span * 0.1, 0);
    const maxY = rawMax + span * 0.1;

    const innerWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
    const innerHeight = HEIGHT - padTop - PAD_BOTTOM;

    const toCoords = (series: LinePoint[]): Coord[] =>
      series.map((p, i) => {
        const x = PAD_LEFT + (series.length === 1 ? 0 : (i / (series.length - 1)) * innerWidth);
        const y = padTop + innerHeight - ((p.y - minY) / (maxY - minY || 1)) * innerHeight;
        return { label: p.x, value: p.y, x, y };
      });

    const yTicks = [minY, (minY + maxY) / 2, maxY];

    return {
      primaryCoords: toCoords(points),
      secondaryCoords: hasSecondary ? toCoords(secondaryPoints ?? []) : [],
      yTicks,
      minY,
      maxY,
    };
  }, [points, secondaryPoints, hasSecondary, padTop]);

  if (points.length < 2) {
    return <p className="text-sm text-brand-muted">{emptyLabel}</p>;
  }

  const innerHeight = HEIGHT - padTop - PAD_BOTTOM;
  const hoveredPrimary = hoverIndex !== null ? primaryCoords[hoverIndex] : null;
  const hoveredSecondary = hoverIndex !== null ? secondaryCoords[hoverIndex] : null;

  const buildPath = (coords: Coord[]) => coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <div className="space-y-3">
      {hasSecondary ? (
        <ChartLegend
          items={[
            { label: primaryLabel ?? "Série 1", color: PRIMARY_COLOR },
            { label: secondaryLabel ?? "Série 2", color: SECONDARY_COLOR },
          ]}
        />
      ) : null}

      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label="Évolution dans le temps"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((tick, i) => {
            const y = padTop + innerHeight - ((tick - minY) / (maxY - minY || 1)) * innerHeight;
            return (
              <g key={i}>
                <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke={CHART_INK.grid} strokeWidth={1} />
                <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" fontSize={10} fill={CHART_INK.muted}>
                  {valueFormat(tick)}
                </text>
              </g>
            );
          })}

          {hoveredPrimary ? (
            <line
              x1={hoveredPrimary.x}
              x2={hoveredPrimary.x}
              y1={padTop}
              y2={HEIGHT - PAD_BOTTOM}
              stroke={CHART_INK.baseline}
              strokeWidth={1}
            />
          ) : null}

          <path
            d={buildPath(primaryCoords)}
            fill="none"
            stroke={PRIMARY_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {hasSecondary ? (
            <path
              d={buildPath(secondaryCoords)}
              fill="none"
              stroke={SECONDARY_COLOR}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {secondaryCoords.map((c, i) => (
            <circle key={"s" + i} cx={c.x} cy={c.y} r={4} fill={SECONDARY_COLOR} stroke="#ffffff" strokeWidth={2} />
          ))}
          {primaryCoords.map((c, i) => (
            <g key={"p" + i}>
              <circle cx={c.x} cy={c.y} r={4} fill={PRIMARY_COLOR} stroke="#ffffff" strokeWidth={2} />
              <circle
                cx={c.x}
                cy={c.y}
                r={12}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onFocus={() => setHoverIndex(i)}
                tabIndex={0}
              />
            </g>
          ))}

          {showDataLabels
            ? primaryCoords.map((c, i) => (
                <text key={"pv" + i} x={c.x} y={c.y - 10} textAnchor="middle" fontSize={9} fontWeight={600} fill={CHART_INK.muted}>
                  {valueFormat(c.value)}
                </text>
              ))
            : null}
          {showDataLabels && hasSecondary
            ? secondaryCoords.map((c, i) => (
                <text key={"sv" + i} x={c.x} y={c.y - 10} textAnchor="middle" fontSize={9} fontWeight={600} fill={CHART_INK.muted}>
                  {valueFormat(c.value)}
                </text>
              ))
            : null}

          {primaryCoords.map((c, i) => (
            <text key={"ax" + i} x={c.x} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill={CHART_INK.muted}>
              {showDataLabels || i === 0 || i === primaryCoords.length - 1 ? c.label : ""}
            </text>
          ))}
        </svg>

        {hoveredPrimary ? (
          <div
            className="pointer-events-none absolute rounded-md border border-brand-line bg-white px-2.5 py-1.5 text-xs shadow-md"
            style={{
              left: `${(hoveredPrimary.x / WIDTH) * 100}%`,
              top: `${(Math.min(hoveredPrimary.y, hoveredSecondary?.y ?? hoveredPrimary.y) / HEIGHT) * 100}%`,
              transform: "translate(-50%, -130%)",
            }}
          >
            <p className="text-brand-muted">{hoveredPrimary.label}</p>
            <p className="font-semibold text-brand-ink">
              {primaryLabel ? `${primaryLabel} : ` : ""}
              {valueFormat(hoveredPrimary.value)}
            </p>
            {hoveredSecondary ? (
              <p className="font-semibold text-brand-ink">
                {secondaryLabel ? `${secondaryLabel} : ` : ""}
                {valueFormat(hoveredSecondary.value)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
