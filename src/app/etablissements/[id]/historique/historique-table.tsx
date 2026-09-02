"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { compareValues, toggleSort, type SortState } from "@/lib/sort";
import { SortHeader } from "@/components/sort-header";
import { SearchInput } from "@/components/search-input";

export type HistoryRow = {
  id: string;
  recipe_nom: string;
  calculated_at: string;
  cout_matiere: number;
  quote_part_frais: number;
  cout_revient_unitaire: number;
  prix_vente: number;
  marge: number;
  taux_marge: number;
  prix_conseille: number;
};

type SortKey =
  | "calculated_at"
  | "recipe_nom"
  | "cout_matiere"
  | "quote_part_frais"
  | "cout_revient_unitaire"
  | "prix_vente"
  | "marge"
  | "prix_conseille";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export function HistoriqueTable({ history }: { history: HistoryRow[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "calculated_at", direction: "desc" });

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? history.filter((entry) => entry.recipe_nom.toLowerCase().includes(query))
      : history;
    return [...filtered].sort((a, b) => {
      const value = compareValues(a[sort.key], b[sort.key]);
      return sort.direction === "asc" ? value : -value;
    });
  }, [history, search, sort]);

  const header = (key: SortKey, label: string) => (
    <SortHeader
      label={label}
      active={sort.key === key}
      direction={sort.direction}
      onClick={() => setSort((current) => toggleSort(current, key))}
    />
  );

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une recette..." />
      </div>

      <div className={tableWrapClass}>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3">{header("calculated_at", "Date")}</th>
              <th className="px-4 py-3">{header("recipe_nom", "Recette")}</th>
              <th className="px-4 py-3">{header("cout_matiere", "Coût matière")}</th>
              <th className="px-4 py-3">{header("quote_part_frais", "Frais")}</th>
              <th className="px-4 py-3">{header("cout_revient_unitaire", "Coût / part")}</th>
              <th className="px-4 py-3">{header("prix_vente", "Prix vente")}</th>
              <th className="px-4 py-3">{header("marge", "Marge")}</th>
              <th className="px-4 py-3">{header("prix_conseille", "Prix conseillé")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((entry) => (
                <tr key={entry.id} className={tableRowClass}>
                  <td className="px-4 py-3 text-brand-muted">{formatDate(entry.calculated_at)}</td>
                  <td className="px-4 py-3 font-medium text-brand-ink">{entry.recipe_nom}</td>
                  <td className="px-4 py-3 text-brand-muted">{money(entry.cout_matiere)}</td>
                  <td className="px-4 py-3 text-brand-muted">{money(entry.quote_part_frais)}</td>
                  <td className="px-4 py-3 text-brand-muted">{money(entry.cout_revient_unitaire)}</td>
                  <td className="px-4 py-3 text-brand-muted">{money(entry.prix_vente)}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {money(entry.marge)} ({entry.taux_marge.toFixed(1)}%)
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{money(entry.prix_conseille)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-brand-muted">
                  {history.length ? "Aucun résultat." : "Aucun calcul enregistré pour l'instant."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
