"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveIngredient, type FormState } from "./actions";
import { PURCHASE_UNITS } from "@/lib/constants";
import { useVocabulary } from "@/components/vocabulary-provider";
import { cardClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

export type IngredientRow = {
  id: string;
  nom: string;
  categorie: string;
  purchase_quantity: number;
  purchase_unit: string;
  purchase_price: number;
};

const UNIT_LABELS: Record<string, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
};

const initialState: FormState = { error: null };

export function IngredientForm({
  establishmentId,
  editing,
  onDone,
}: {
  establishmentId: string;
  editing: IngredientRow | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveIngredient, initialState);
  const vocab = useVocabulary();
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      onDone();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 ${cardClass}`}
    >
      <input type="hidden" name="establishment_id" value={establishmentId} />
      {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

      <div className="col-span-2 sm:col-span-2">
        <label className={labelClass}>Nom</label>
        <input
          name="nom"
          type="text"
          required
          defaultValue={editing?.nom ?? ""}
          key={`nom-${editing?.id ?? "new"}`}
          placeholder={vocab.ingredientPlaceholder}
          className={inputClass}
        />
      </div>

      <div className="col-span-2 sm:col-span-2">
        <label className={labelClass}>Catégorie</label>
        <select
          name="categorie"
          defaultValue={editing?.categorie ?? vocab.categories[0]}
          key={`cat-${editing?.id ?? "new"}`}
          className={inputClass}
        >
          {/* Une catégorie héritée d'un autre métier reste sélectionnable en modification. */}
          {(editing && !vocab.categories.includes(editing.categorie)
            ? [editing.categorie, ...vocab.categories]
            : vocab.categories
          ).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Quantité achetée</label>
        <input
          name="purchase_quantity"
          type="text"
          inputMode="decimal"
          required
          defaultValue={editing?.purchase_quantity ?? ""}
          key={`qty-${editing?.id ?? "new"}`}
          placeholder="25"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Unité d&apos;achat</label>
        <select
          name="purchase_unit"
          defaultValue={editing?.purchase_unit ?? vocab.defaultPurchaseUnit}
          key={`unit-${editing?.id ?? "new"}`}
          className={inputClass}
        >
          {PURCHASE_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit === "piece" ? vocab.pieceLabel : UNIT_LABELS[unit]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Prix d&apos;achat €</label>
        <input
          name="purchase_price"
          type="text"
          inputMode="decimal"
          required
          defaultValue={editing?.purchase_price ?? ""}
          key={`price-${editing?.id ?? "new"}`}
          placeholder="18.50"
          className={inputClass}
        />
      </div>

      <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Enregistrement..." : editing ? "Mettre à jour" : `Ajouter ${vocab.theIngredient}`}
        </button>
        {editing ? (
          <button type="button" onClick={onDone} className={secondaryButtonClass}>
            Annuler
          </button>
        ) : null}
        {state.error ? <p className="text-sm text-brand-danger">{state.error}</p> : null}
      </div>
    </form>
  );
}
