import { number } from "./format";

export type UnitKind = "weight" | "volume" | "piece";

export const UNITS: Record<string, { kind: UnitKind; factor: number; label: string }> = {
  g: { kind: "weight", factor: 1, label: "g" },
  kg: { kind: "weight", factor: 1000, label: "kg" },
  ml: { kind: "volume", factor: 1, label: "ml" },
  l: { kind: "volume", factor: 1000, label: "l" },
  piece: { kind: "piece", factor: 1, label: "pièce" },
};

const BASE_UNIT_BY_KIND: Record<UnitKind, string> = {
  weight: "g",
  volume: "ml",
  piece: "piece",
};

export function baseUnitFor(purchaseUnit: string): string {
  return BASE_UNIT_BY_KIND[UNITS[purchaseUnit].kind];
}

export function compatibleUnits(unit: string): string[] {
  const kind = UNITS[unit].kind;
  return Object.entries(UNITS)
    .filter(([, def]) => def.kind === kind)
    .map(([name]) => name);
}

// Prix de l'ingrédient pour une unité de l'unité de base (g, ml ou pièce).
export function pricePerUsageUnit(
  purchaseQuantity: number,
  purchaseUnit: string,
  purchasePrice: number
): number {
  const { factor } = UNITS[purchaseUnit];
  const usableQuantity = purchaseQuantity * factor;
  return usableQuantity > 0 ? purchasePrice / usableQuantity : 0;
}

// Convertit une quantité exprimée dans `fromUnit` vers l'unité de base compatible.
export function toBaseQuantity(quantity: number, fromUnit: string): number {
  return quantity * UNITS[fromUnit].factor;
}

// Affiche une quantité en unité de base (g/ml/pièce) en basculant vers l'unité
// "ronde" (kg/l) au-delà de 1000, pour éviter les nombres à 4+ chiffres.
export function formatBaseQuantity(quantity: number, usageUnit: string): string {
  if (usageUnit === "g" && quantity >= 1000) {
    return `${number(quantity / 1000)} kg`;
  }
  if (usageUnit === "ml" && quantity >= 1000) {
    return `${number(quantity / 1000)} l`;
  }
  return `${number(quantity)} ${usageUnit}`;
}

const PRICE_DISPLAY_UNIT_BY_BASE: Record<string, { unit: string; factor: number }> = {
  g: { unit: "kg", factor: 1000 },
  ml: { unit: "l", factor: 1000 },
  piece: { unit: "piece", factor: 1 },
};

// Un prix par gramme/millilitre est toujours minuscule (souvent 0,00 € une fois
// arrondi) : on l'exprime plutôt au kg/litre, une échelle où le prix reste lisible.
export function toDisplayUnitPrice(
  pricePerBaseUnit: number,
  baseUnit: string
): { price: number; unit: string } {
  const display = PRICE_DISPLAY_UNIT_BY_BASE[baseUnit] ?? { unit: baseUnit, factor: 1 };
  return { price: pricePerBaseUnit * display.factor, unit: display.unit };
}
