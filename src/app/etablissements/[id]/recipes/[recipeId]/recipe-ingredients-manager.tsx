"use client";

import { useMemo, useTransition } from "react";
import { deleteRecipeIngredient } from "./actions";
import { pricePerUsageUnit, toBaseQuantity } from "@/lib/units";
import { moneyPrecise, number } from "@/lib/format";
import { dangerLinkClass, tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";

export type AvailableIngredient = {
  id: string;
  nom: string;
  categorie: string;
  purchase_quantity: number;
  purchase_unit: string;
  purchase_price: number;
};

export type RecipeIngredientRow = {
  id: string;
  quantite: number;
  unite: string;
  ingredient_id: string;
  ingredient: AvailableIngredient;
};

const UNIT_LABELS: Record<string, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  piece: "pièce(s)",
};

export function RecipeIngredientsManager({
  establishmentId,
  recipeId,
  items,
}: {
  establishmentId: string;
  recipeId: string;
  items: RecipeIngredientRow[];
}) {
  const [deleting, startDeleteTransition] = useTransition();

  const rows = useMemo(
    () =>
      items.map((item) => {
        const unitPrice = pricePerUsageUnit(
          item.ingredient.purchase_quantity,
          item.ingredient.purchase_unit,
          item.ingredient.purchase_price
        );
        const cost = toBaseQuantity(item.quantite, item.unite) * unitPrice;
        return { ...item, cost };
      }),
    [items]
  );

  return (
    <div className={tableWrapClass}>
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className={tableHeadClass}>
          <tr>
            <th className="px-4 py-3">Ingrédient</th>
            <th className="px-4 py-3">Quantité</th>
            <th className="px-4 py-3">Coût</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={row.id} className={tableRowClass}>
                <td className="px-4 py-3 font-medium text-brand-ink">{row.ingredient.nom}</td>
                <td className="px-4 py-3 text-brand-muted">
                  {number(row.quantite)} {UNIT_LABELS[row.unite]}
                </td>
                <td className="px-4 py-3 text-brand-muted">{moneyPrecise(row.cost)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() =>
                      startDeleteTransition(() =>
                        deleteRecipeIngredient(row.id, establishmentId, recipeId)
                      )
                    }
                    className={dangerLinkClass}
                  >
                    Retirer
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-brand-muted">
                Aucun ingrédient ajouté. Cliquez-en un à gauche pour l&apos;ajouter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
