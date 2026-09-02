export type SortDirection = "asc" | "desc";

export type SortState<K extends string> = { key: K; direction: SortDirection };

export function toggleSort<K extends string>(
  current: SortState<K>,
  key: K
): SortState<K> {
  if (current.key !== key) return { key, direction: "asc" };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

export function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "fr", { sensitivity: "base" });
}
