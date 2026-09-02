"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveRecipe, type FormState } from "./actions";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

export type RecipeRow = {
  id: string;
  nom: string;
  portions: number;
  prix_vente: number;
};

const initialState: FormState = { error: null };

export function RecipeForm({
  establishmentId,
  editing,
  onSaved,
}: {
  establishmentId: string;
  editing?: RecipeRow | null;
  onSaved?: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveRecipe, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      if (!editing) formRef.current?.reset();
      onSaved?.();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 ${cardClass}`}
    >
      <input type="hidden" name="establishment_id" value={establishmentId} />
      {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

      <div className="col-span-2 sm:col-span-4">
        <label className={labelClass}>Nom de la recette</label>
        <input
          name="nom"
          type="text"
          required
          defaultValue={editing?.nom ?? ""}
          placeholder="Ex : Baguette tradition"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Nombre de parts</label>
        <p className="mt-1 text-xs text-brand-muted">
          Combien de parts vendables produit une fournée (1 si vendu à la pièce).
        </p>
        <input
          name="portions"
          type="text"
          inputMode="decimal"
          required
          defaultValue={editing?.portions ?? 1}
          placeholder="1"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Prix de vente € / part</label>
        <input
          name="prix_vente"
          type="text"
          inputMode="decimal"
          required
          defaultValue={editing?.prix_vente ?? ""}
          placeholder="1.20"
          className={inputClass}
        />
      </div>

      <div className="col-span-2 flex items-end sm:col-span-4">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer la recette"}
        </button>
      </div>

      {state.error ? (
        <p className="col-span-2 text-sm text-brand-danger sm:col-span-4">{state.error}</p>
      ) : null}
    </form>
  );
}
