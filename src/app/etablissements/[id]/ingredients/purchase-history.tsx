"use client";

import { useActionState, useEffect, useMemo, useRef, useTransition } from "react";
import { addIngredientPurchase, deleteIngredientPurchase, type FormState } from "./actions";
import { pricePerUsageUnit, baseUnitFor } from "@/lib/units";
import { money, moneyPrecise, number } from "@/lib/format";
import { cardClass, dangerLinkClass, inputClass, labelClass, primaryButtonClass } from "@/lib/ui";
import { PURCHASE_UNITS } from "@/lib/constants";
import type { SupplierRow } from "./suppliers-manager";
import { useVocabulary } from "@/components/vocabulary-provider";

export type PurchaseRow = {
  id: string;
  purchased_at: string;
  quantity: number;
  unit: string;
  price: number;
  note: string;
  supplier_id: string | null;
};

const UNIT_LABELS: Record<string, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
};

const initialState: FormState = { error: null };

export function PurchaseHistory({
  establishmentId,
  ingredientId,
  purchases,
  suppliers,
  defaultUnit = "kg",
}: {
  establishmentId: string;
  ingredientId: string;
  purchases: PurchaseRow[];
  suppliers: SupplierRow[];
  defaultUnit?: string; // unité d'achat habituelle de l'élément, présélectionnée
}) {
  const vocab = useVocabulary();
  const [state, formAction, pending] = useActionState(addIngredientPurchase, initialState);
  const [deleting, startDeleteTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const sorted = useMemo(
    () =>
      [...purchases].sort(
        (a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime()
      ),
    [purchases]
  );

  const rows = useMemo(
    () =>
      sorted.map((purchase, index) => {
        const unitPrice = pricePerUsageUnit(purchase.quantity, purchase.unit, purchase.price);
        const previous = sorted[index + 1];
        const previousUnitPrice = previous
          ? pricePerUsageUnit(previous.quantity, previous.unit, previous.price)
          : null;
        const changeRate =
          previousUnitPrice && previousUnitPrice > 0
            ? ((unitPrice - previousUnitPrice) / previousUnitPrice) * 100
            : null;
        return { ...purchase, unitPrice, changeRate };
      }),
    [sorted]
  );

  const supplierComparison = useMemo(() => {
    const bySupplier = new Map<string, number[]>();
    for (const row of rows) {
      if (!row.supplier_id) continue;
      const list = bySupplier.get(row.supplier_id) ?? [];
      list.push(row.unitPrice);
      bySupplier.set(row.supplier_id, list);
    }
    return Array.from(bySupplier.entries())
      .map(([supplierId, prices]) => ({
        supplierId,
        nom: suppliers.find((s) => s.id === supplierId)?.nom ?? "Fournisseur",
        avg: prices.reduce((a, b) => a + b, 0) / prices.length,
        count: prices.length,
      }))
      .sort((a, b) => a.avg - b.avg);
  }, [rows, suppliers]);

  const supplierName = (id: string | null) => (id ? suppliers.find((s) => s.id === id)?.nom : null);

  return (
    <div className="space-y-4 border-t border-brand-line/70 bg-brand-panel-soft/40 p-3 sm:p-4">
      <form
        ref={formRef}
        action={formAction}
        className={`grid grid-cols-2 gap-3 p-4 lg:flex lg:items-end ${cardClass}`}
      >
        <input type="hidden" name="establishment_id" value={establishmentId} />
        <input type="hidden" name="ingredient_id" value={ingredientId} />

        <div>
          <label className={labelClass}>Date</label>
          <input
            name="purchased_at"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Quantité</label>
          <input name="quantity" type="text" inputMode="decimal" required placeholder="25" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Unité</label>
          <select name="unit" defaultValue={defaultUnit} className={inputClass}>
            {PURCHASE_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit === "piece" ? vocab.pieceLabel : UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Prix payé €</label>
          <input name="price" type="text" inputMode="decimal" required placeholder="18.50" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Fournisseur</label>
          <select name="supplier_id" defaultValue="" className={inputClass}>
            <option value="">Aucun</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Note</label>
          <input name="note" placeholder="Optionnel..." className={inputClass} />
        </div>
        <button type="submit" disabled={pending} className={`col-span-2 ${primaryButtonClass}`}>
          {pending ? "Ajout..." : "Enregistrer l'achat"}
        </button>
        {state.error ? <p className="col-span-2 text-sm text-brand-danger lg:basis-full">{state.error}</p> : null}
      </form>

      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-line bg-white px-4 py-2.5 text-sm"
            >
              <span className="text-brand-muted">
                {new Date(row.purchased_at).toLocaleDateString("fr-FR")}
              </span>
              <span className="text-brand-ink">
                {number(row.quantity)} {row.unit === "piece" ? vocab.pieceLabel : UNIT_LABELS[row.unit]} · {money(row.price)}
              </span>
              <span className="font-medium text-brand-ink">
                {moneyPrecise(row.unitPrice)} / {baseUnitFor(row.unit)}
              </span>
              {row.changeRate !== null ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    row.changeRate > 0.5
                      ? "bg-brand-danger-bg text-brand-danger"
                      : row.changeRate < -0.5
                        ? "bg-brand-success-bg text-brand-success"
                        : "bg-brand-panel-soft text-brand-muted"
                  }`}
                >
                  {row.changeRate > 0 ? "+" : ""}
                  {row.changeRate.toFixed(1)}% vs achat précédent
                </span>
              ) : null}
              {supplierName(row.supplier_id) ? (
                <span className="rounded-full bg-brand-panel-soft px-2 py-0.5 text-xs text-brand-muted">
                  {supplierName(row.supplier_id)}
                </span>
              ) : null}
              {row.note ? <span className="text-brand-muted">{row.note}</span> : null}
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  if (confirm("Supprimer cet achat de l'historique ?")) {
                    startDeleteTransition(() => deleteIngredientPurchase(row.id, establishmentId));
                  }
                }}
                className={dangerLinkClass}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-brand-muted">Aucun achat enregistré pour {vocab.thisIngredient}.</p>
      )}

      {supplierComparison.length >= 2 ? (
        <div className="rounded-lg border border-brand-line bg-white p-4">
          <p className="text-sm font-medium text-brand-ink">Comparaison fournisseurs</p>
          <p className="mt-0.5 text-xs text-brand-muted">
            Prix moyen payé par fournisseur, au {baseUnitFor(rows[0]?.unit ?? "kg")}.
          </p>
          <ul className="mt-3 space-y-1.5">
            {supplierComparison.map((s, index) => (
              <li key={s.supplierId} className="flex items-center justify-between text-sm">
                <span className="text-brand-ink">
                  {s.nom}
                  {index === 0 ? (
                    <span className="ml-2 rounded-full bg-brand-success-bg px-2 py-0.5 text-xs font-semibold text-brand-success">
                      Moins cher
                    </span>
                  ) : null}
                </span>
                <span className="font-medium text-brand-muted">
                  {moneyPrecise(s.avg)} · {s.count} achat(s)
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
