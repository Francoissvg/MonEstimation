"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeleteRecipeButton } from "./delete-recipe-button";
import { money, number } from "@/lib/format";
import { tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { compareValues, toggleSort, type SortState } from "@/lib/sort";
import { SortHeader } from "@/components/sort-header";
import { SearchInput } from "@/components/search-input";

export type RecipeListRow = {
  id: string;
  nom: string;
  portions: number;
  prix_vente: number;
  margin: number;
  marginRate: number;
};

const LOW_MARGIN_RATE = 60;

type SortKey = "nom" | "portions" | "prix_vente" | "total" | "margin" | "marginRate";

export function RecipesList({
  establishmentId,
  recipes,
}: {
  establishmentId: string;
  recipes: RecipeListRow[];
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "nom", direction: "asc" });

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query ? recipes.filter((r) => r.nom.toLowerCase().includes(query)) : recipes;
    return [...filtered].sort((a, b) => {
      const value =
        sort.key === "total"
          ? compareValues(a.prix_vente * a.portions, b.prix_vente * b.portions)
          : compareValues(a[sort.key], b[sort.key]);
      return sort.direction === "asc" ? value : -value;
    });
  }, [recipes, search, sort]);

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
              <th className="px-4 py-3">{header("nom", "Nom")}</th>
              <th className="px-4 py-3">{header("portions", "Parts")}</th>
              <th className="px-4 py-3">{header("prix_vente", "Prix / part")}</th>
              <th className="px-4 py-3">{header("total", "CA total / fournée")}</th>
              <th className="px-4 py-3">{header("margin", "Marge / part")}</th>
              <th className="px-4 py-3">{header("marginRate", "Taux")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((recipe) => (
                <tr key={recipe.id} className={tableRowClass}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/etablissements/${establishmentId}/recipes/${recipe.id}`}
                      className="font-medium text-brand-ink hover:text-brand-accent hover:underline"
                    >
                      {recipe.nom}
                    </Link>
                    <Link
                      href={`/etablissements/${establishmentId}/recipes/${recipe.id}`}
                      className="block text-xs text-brand-accent hover:underline"
                    >
                      Voir le détail →
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{number(recipe.portions)}</td>
                  <td className="px-4 py-3 text-brand-muted">{money(recipe.prix_vente)}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {money(recipe.prix_vente * recipe.portions)}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{money(recipe.margin)}</td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      recipe.prix_vente > 0 && recipe.marginRate < LOW_MARGIN_RATE
                        ? "text-brand-danger"
                        : "text-brand-success"
                    }`}
                  >
                    {recipe.prix_vente > 0 ? `${recipe.marginRate.toFixed(1)}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteRecipeButton id={recipe.id} establishmentId={establishmentId} nom={recipe.nom} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-muted">
                  {recipes.length ? "Aucun résultat." : "Aucune recette pour l'instant."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
