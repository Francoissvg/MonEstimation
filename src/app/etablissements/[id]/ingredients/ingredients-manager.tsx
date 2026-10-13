"use client";

import { Fragment, useMemo, useRef, useState, useTransition } from "react";
import { IngredientForm, type IngredientRow } from "./ingredient-form";
import { deleteIngredient } from "./actions";
import { PurchaseHistory, type PurchaseRow } from "./purchase-history";
import { SuppliersManager, type SupplierRow } from "./suppliers-manager";
import { pricePerUsageUnit, baseUnitFor, toDisplayUnitPrice } from "@/lib/units";
import { money, number } from "@/lib/format";
import { cardClass, tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { compareValues, toggleSort, type SortState } from "@/lib/sort";
import { SortHeader } from "@/components/sort-header";
import { SearchInput } from "@/components/search-input";
import { RowActionsMenu } from "@/components/row-actions-menu";
import { useVocabulary } from "@/components/vocabulary-provider";

type SortKey = "nom" | "categorie" | "purchase_price" | "unitPrice";

export function IngredientsManager({
  establishmentId,
  ingredients,
  purchasesByIngredient,
  suppliers,
  purchaseCountBySupplier,
}: {
  establishmentId: string;
  ingredients: IngredientRow[];
  purchasesByIngredient: Record<string, PurchaseRow[]>;
  suppliers: SupplierRow[];
  purchaseCountBySupplier: Record<string, number>;
}) {
  const vocab = useVocabulary();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "nom", direction: "asc" });
  const editing = ingredients.find((i) => i.id === editingId) ?? null;
  const formWrapRef = useRef<HTMLDivElement>(null);

  // Le formulaire est en haut de page : sur téléphone, on y remonte pour la modification.
  const startEditing = (id: string) => {
    setEditingId(id);
    formWrapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const actionsFor = (ingredient: IngredientRow, expanded: boolean, purchaseCount: number) => [
    {
      label: `Historique${purchaseCount ? ` (${purchaseCount})` : ""}`,
      onClick: () => setExpandedId(expanded ? null : ingredient.id),
    },
    { label: "Modifier", onClick: () => startEditing(ingredient.id) },
    {
      label: "Supprimer",
      tone: "danger" as const,
      disabled: pending,
      onClick: () => {
        if (confirm(`Supprimer "${ingredient.nom}" ?`)) {
          startTransition(() => deleteIngredient(ingredient.id, establishmentId));
        }
      },
    },
  ];

  const rows = useMemo(() => {
    const withUnitPrice = ingredients.map((ingredient) => ({
      ingredient,
      unitPrice: pricePerUsageUnit(
        ingredient.purchase_quantity,
        ingredient.purchase_unit,
        ingredient.purchase_price
      ),
    }));

    const query = search.trim().toLowerCase();
    const filtered = query
      ? withUnitPrice.filter(
          ({ ingredient }) =>
            ingredient.nom.toLowerCase().includes(query) ||
            ingredient.categorie.toLowerCase().includes(query)
        )
      : withUnitPrice;

    const sorted = [...filtered].sort((a, b) => {
      const value =
        sort.key === "unitPrice"
          ? compareValues(a.unitPrice, b.unitPrice)
          : sort.key === "purchase_price"
            ? compareValues(a.ingredient.purchase_price, b.ingredient.purchase_price)
            : compareValues(a.ingredient[sort.key], b.ingredient[sort.key]);
      return sort.direction === "asc" ? value : -value;
    });

    return sorted;
  }, [ingredients, search, sort]);

  const header = (key: SortKey, label: string) => (
    <SortHeader
      label={label}
      active={sort.key === key}
      direction={sort.direction}
      onClick={() => setSort((current) => toggleSort(current, key))}
    />
  );

  return (
    <div className="space-y-6">
      <div ref={formWrapRef} className="scroll-mt-20">
        <IngredientForm
          establishmentId={establishmentId}
          editing={editing}
          onDone={() => setEditingId(null)}
        />
      </div>

      <div className="sm:max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder={`Rechercher ${vocab.anIngredient}...`} />
      </div>

      {/* Téléphone : une fiche par élément, l'historique d'achat s'ouvre en pleine largeur. */}
      <ul className="space-y-3 md:hidden">
        {rows.length ? (
          rows.map(({ ingredient, unitPrice }) => {
            const expanded = expandedId === ingredient.id;
            const purchaseCount = purchasesByIngredient[ingredient.id]?.length ?? 0;
            const display = toDisplayUnitPrice(unitPrice, baseUnitFor(ingredient.purchase_unit));
            return (
              <li key={ingredient.id} className={`overflow-hidden ${cardClass}`}>
                <div className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-ink">{ingredient.nom}</p>
                    <p className="text-xs text-brand-muted">{ingredient.categorie}</p>
                    <p className="mt-2 text-sm text-brand-muted">
                      {number(ingredient.purchase_quantity)} {ingredient.purchase_unit} ·{" "}
                      {money(ingredient.purchase_price)}
                    </p>
                    <p className="text-sm font-medium text-brand-ink">
                      {money(display.price)} / {display.unit}
                    </p>
                  </div>
                  <RowActionsMenu actions={actionsFor(ingredient, expanded, purchaseCount)} />
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : ingredient.id)}
                  className="w-full border-t border-brand-line/70 px-4 py-3 text-left text-sm font-medium text-brand-accent-dark transition-colors hover:bg-brand-panel-soft"
                  aria-expanded={expanded}
                >
                  {expanded
                    ? "Fermer"
                    : `+ Ajouter un achat${purchaseCount ? ` · historique (${purchaseCount})` : ""}`}
                </button>
                {expanded ? (
                  <PurchaseHistory
                    establishmentId={establishmentId}
                    ingredientId={ingredient.id}
                    purchases={purchasesByIngredient[ingredient.id] ?? []}
                    suppliers={suppliers}
                    defaultUnit={ingredient.purchase_unit}
                  />
                ) : null}
              </li>
            );
          })
        ) : (
          <li className="rounded-xl border border-dashed border-brand-line p-8 text-center text-sm text-brand-muted">
            {ingredients.length ? "Aucun résultat." : `${vocab.noIngredient} pour l'instant.`}
          </li>
        )}
      </ul>

      <div className={`hidden md:block ${tableWrapClass}`}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3">{header("nom", "Nom")}</th>
              <th className="px-4 py-3">{header("categorie", "Catégorie")}</th>
              <th className="px-4 py-3">Achat</th>
              <th className="px-4 py-3">{header("purchase_price", "Prix")}</th>
              <th className="px-4 py-3">{header("unitPrice", "Coût unitaire")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map(({ ingredient, unitPrice }) => {
                const expanded = expandedId === ingredient.id;
                const purchaseCount = purchasesByIngredient[ingredient.id]?.length ?? 0;
                const display = toDisplayUnitPrice(unitPrice, baseUnitFor(ingredient.purchase_unit));
                return (
                  <Fragment key={ingredient.id}>
                    <tr className={tableRowClass}>
                      <td className="px-4 py-3 font-medium text-brand-ink">{ingredient.nom}</td>
                      <td className="px-4 py-3 text-brand-muted">{ingredient.categorie}</td>
                      <td className="px-4 py-3 text-brand-muted">
                        {number(ingredient.purchase_quantity)} {ingredient.purchase_unit}
                      </td>
                      <td className="px-4 py-3 text-brand-muted">{money(ingredient.purchase_price)}</td>
                      <td className="px-4 py-3 text-brand-muted">
                        {money(display.price)} / {display.unit}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RowActionsMenu actions={actionsFor(ingredient, expanded, purchaseCount)} />
                      </td>
                    </tr>
                    {expanded ? (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <PurchaseHistory
                            establishmentId={establishmentId}
                            ingredientId={ingredient.id}
                            purchases={purchasesByIngredient[ingredient.id] ?? []}
                            suppliers={suppliers}
                            defaultUnit={ingredient.purchase_unit}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                  {ingredients.length ? "Aucun résultat." : `${vocab.noIngredient} pour l'instant.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SuppliersManager
        establishmentId={establishmentId}
        suppliers={suppliers}
        purchaseCountBySupplier={purchaseCountBySupplier}
      />
    </div>
  );
}
