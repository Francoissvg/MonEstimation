import { money, number } from "./format";

// Une chaîne (sérialisable) plutôt qu'une fonction : les fonctions ne peuvent pas
// traverser la frontière Server Component → Client Component en Next.js.
export type ChartValueFormat = "money" | "percent" | "number";

export function formatChartValue(format: ChartValueFormat, value: number): string {
  switch (format) {
    case "money":
      return money(value);
    case "percent":
      return `${value.toFixed(0)}%`;
    case "number":
      return number(Math.round(value));
  }
}
