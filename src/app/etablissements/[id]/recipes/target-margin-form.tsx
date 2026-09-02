"use client";

import { useActionState } from "react";
import { saveTargetMargin, type FormState } from "../parametres/actions";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

const initialState: FormState = { error: null };

export function TargetMarginForm({
  establishmentId,
  margeCible,
}: {
  establishmentId: string;
  margeCible: number;
}) {
  const [state, formAction, pending] = useActionState(saveTargetMargin, initialState);

  return (
    <form action={formAction} className={`flex flex-col gap-3 p-5 sm:flex-row sm:items-end ${cardClass}`}>
      <input type="hidden" name="establishment_id" value={establishmentId} />

      <div className="flex-1">
        <label className={labelClass}>Marge cible</label>
        <p className="mt-1 text-xs text-brand-muted">
          Utilisée pour calculer le prix conseillé de toutes vos recettes.
        </p>
        <input
          name="marge_cible"
          type="text"
          inputMode="decimal"
          required
          defaultValue={margeCible}
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>

      {state.error ? <p className="text-sm text-brand-danger">{state.error}</p> : null}
    </form>
  );
}
