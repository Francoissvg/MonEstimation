"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { saveRecipeIngredient, type FormState } from "./actions";
import { saveWorkshopItem } from "../../ateliers/actions";
import { compatibleUnits, pricePerUsageUnit, baseUnitFor } from "@/lib/units";
import { money } from "@/lib/format";
import { cardClass, inputClass, primaryButtonClass } from "@/lib/ui";
import type { AvailableIngredient } from "./recipe-ingredients-manager";
import { useVocabulary } from "@/components/vocabulary-provider";

const UNIT_LABELS: Record<string, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
};

const initialState: FormState = { error: null };

// Sélection d'un élément à ajouter à une recette ou au kit d'un atelier (`target`).
export function IngredientPicker({
  establishmentId,
  ownerId,
  availableIngredients,
  target = "recipe",
}: {
  establishmentId: string;
  ownerId: string; // id de la recette ou de l'atelier
  availableIngredients: AvailableIngredient[];
  target?: "recipe" | "workshop";
}) {
  const vocab = useVocabulary();
  const [state, formAction, pending] = useActionState(
    target === "workshop" ? saveWorkshopItem : saveRecipeIngredient,
    initialState
  );
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const quantityRef = useRef<HTMLInputElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setSelectedId(null);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableIngredients;
    return availableIngredients.filter(
      (ingredient) =>
        ingredient.nom.toLowerCase().includes(query) ||
        ingredient.categorie.toLowerCase().includes(query)
    );
  }, [availableIngredients, search]);

  const selected = availableIngredients.find((i) => i.id === selectedId) ?? null;
  const unitOptions = selected ? compatibleUnits(selected.purchase_unit) : [];

  if (!availableIngredients.length) {
    return (
      <p className="rounded-xl border border-dashed border-brand-line bg-white p-6 text-center text-sm text-brand-muted">
        Ajoutez d&apos;abord des {vocab.ingredientsLower} à cet établissement avant de{" "}
        {target === "workshop" ? "constituer le kit" : `composer une ${vocab.recipeLower}`}.
      </p>
    );
  }

  return (
    <div className={`overflow-hidden ${cardClass}`}>
      <div className="border-b border-brand-line p-3">
        <input
          type="text"
          placeholder={`Rechercher ${vocab.anIngredient}...`}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className={inputClass}
        />
      </div>

      {selected ? (
        <form
          ref={formRef}
          action={formAction}
          className="flex flex-wrap items-end gap-2 border-b border-brand-line bg-brand-panel-soft/60 p-3"
        >
          <input type="hidden" name="establishment_id" value={establishmentId} />
          <input type="hidden" name={target === "workshop" ? "workshop_id" : "recipe_id"} value={ownerId} />
          <input type="hidden" name="ingredient_id" value={selected.id} />
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-ink">{selected.nom}</p>
            <p className="text-xs text-brand-muted">
              {money(
                pricePerUsageUnit(selected.purchase_quantity, selected.purchase_unit, selected.purchase_price)
              )}{" "}
              / {baseUnitFor(selected.purchase_unit)}
            </p>
          </div>
          <input
            ref={quantityRef}
            name="quantite"
            type="text"
            inputMode="decimal"
            required
            autoFocus
            placeholder="Quantité"
            className={`${inputClass} mt-0 w-28`}
          />
          <select name="unite" className={`${inputClass} mt-0 w-28`}>
            {unitOptions.map((unit) => (
              <option key={unit} value={unit}>
                {unit === "piece" ? vocab.pieceLabel : UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Ajout..." : "Ajouter"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-sm text-brand-muted hover:underline"
          >
            Annuler
          </button>
          {state.error ? <p className="w-full text-sm text-brand-danger">{state.error}</p> : null}
        </form>
      ) : null}

      <div className="max-h-[420px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <tbody>
            {filtered.length ? (
              filtered.map((ingredient) => {
                const unitPrice = pricePerUsageUnit(
                  ingredient.purchase_quantity,
                  ingredient.purchase_unit,
                  ingredient.purchase_price
                );
                const active = ingredient.id === selectedId;
                return (
                  <tr
                    key={ingredient.id}
                    onClick={() => setSelectedId(ingredient.id)}
                    className={`cursor-pointer border-b border-brand-line/60 last:border-0 transition-colors ${
                      active ? "bg-brand-accent/10" : "hover:bg-brand-panel-soft/60"
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-brand-ink">{ingredient.nom}</p>
                      <p className="text-xs text-brand-muted">{ingredient.categorie}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-brand-muted">
                      {money(unitPrice)} / {baseUnitFor(ingredient.purchase_unit)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-brand-muted">Aucun résultat.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
