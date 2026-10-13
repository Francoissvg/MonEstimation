"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { compareValues, toggleSort, type SortState } from "@/lib/sort";
import { SortHeader } from "@/components/sort-header";
import { useVocabulary } from "@/components/vocabulary-provider";

const LOW_MARGIN_RATE = 60;

export type DashboardRecipeRow = {
  id: string;
  nom: string;
  prix_vente: number;
  matterPerUnit: number;
  overheadPerUnit: number;
  margin: number;
  marginRate: number;
  grossMargin: number;
  grossMarginRate: number;
};

type SortKey =
  | "nom"
  | "matterPerUnit"
  | "overheadPerUnit"
  | "prix_vente"
  | "margin"
  | "marginRate"
  | "grossMargin"
  | "grossMarginRate";

export function DashboardRecipesTable({
  establishmentId,
  rows,
}: {
  establishmentId: string;
  rows: DashboardRecipeRow[];
}) {
  const vocab = useVocabulary();
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "nom", direction: "asc" });

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const value = compareValues(a[sort.key], b[sort.key]);
        return sort.direction === "asc" ? value : -value;
      }),
    [rows, sort]
  );

  const header = (key: SortKey, label: string) => (
    <SortHeader
      label={label}
      active={sort.key === key}
      direction={sort.direction}
      onClick={() => setSort((current) => toggleSort(current, key))}
    />
  );

  return (
    <div className={tableWrapClass}>
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead className={tableHeadClass}>
          <tr>
            <th className="px-4 py-3">{header("nom", vocab.recipe)}</th>
            <th className="px-4 py-3">{header("matterPerUnit", `Prix de fabrication / ${vocab.part}`)}</th>
            <th className="px-4 py-3">{header("overheadPerUnit", `Frais associés / ${vocab.part}`)}</th>
            <th className="px-4 py-3">{header("prix_vente", `Prix vente / ${vocab.part}`)}</th>
            <th className="px-4 py-3">{header("grossMargin", "Marge brute (sans frais)")}</th>
            <th className="px-4 py-3">{header("grossMarginRate", "Taux brut")}</th>
            <th className="px-4 py-3">{header("margin", `Marge / ${vocab.part}`)}</th>
            <th className="px-4 py-3">{header("marginRate", "Taux")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length ? (
            sorted.map((recipe) => (
              <tr key={recipe.id} className={tableRowClass}>
                <td className="px-4 py-3">
                  <Link
                    href={`/etablissements/${establishmentId}/recipes/${recipe.id}`}
                    className="font-medium text-brand-ink hover:text-brand-accent hover:underline"
                  >
                    {recipe.nom}
                  </Link>
                </td>
                <td className="px-4 py-3 text-brand-muted">{money(recipe.matterPerUnit)}</td>
                <td className="px-4 py-3 text-brand-muted">{money(recipe.overheadPerUnit)}</td>
                <td className="px-4 py-3 text-brand-muted">{money(recipe.prix_vente)}</td>
                <td className="px-4 py-3 text-brand-muted">{money(recipe.grossMargin)}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    recipe.prix_vente > 0 && recipe.grossMarginRate < LOW_MARGIN_RATE
                      ? "text-brand-danger"
                      : "text-brand-success"
                  }`}
                >
                  {recipe.prix_vente > 0 ? `${recipe.grossMarginRate.toFixed(1)}%` : "-"}
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
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-brand-muted">
                Aucune {vocab.recipeLower} pour l&apos;instant.{" "}
                <Link href={`/etablissements/${establishmentId}/recipes`} className="underline">
                  Créez-en une
                </Link>
                .
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
