"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveWorkshop, type FormState } from "./actions";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

export type WorkshopFormValues = {
  id: string;
  nom: string;
  prix_participant: number;
  duree_heures: number;
  cout_horaire: number;
  frais_seance: number;
  min_participants: number;
  max_participants: number;
};

const initialState: FormState = { error: null };

function NumberField({
  name,
  label,
  hint,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: number | string;
  placeholder: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {hint ? <p className="mt-1 text-xs text-brand-muted">{hint}</p> : null}
      <input
        name={name}
        type="text"
        inputMode="decimal"
        required
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

export function WorkshopForm({
  establishmentId,
  editing,
}: {
  establishmentId: string;
  editing?: WorkshopFormValues | null;
}) {
  const [state, formAction, pending] = useActionState(saveWorkshop, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error && !editing) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error, editing]);

  return (
    <form ref={formRef} action={formAction} className={`grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 ${cardClass}`}>
      <input type="hidden" name="establishment_id" value={establishmentId} />
      {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

      <div className="col-span-2 sm:col-span-3">
        <label className={labelClass}>Nom de l&apos;atelier</label>
        <input
          name="nom"
          type="text"
          required
          defaultValue={editing?.nom ?? ""}
          placeholder="Ex : Atelier couronne de Noël"
          className={inputClass}
        />
      </div>
      <NumberField
        name="prix_participant"
        label="Prix € / participant"
        defaultValue={editing?.prix_participant ?? ""}
        placeholder="45"
      />

      <NumberField
        name="duree_heures"
        label="Durée (heures)"
        hint="Préparation + animation."
        defaultValue={editing?.duree_heures ?? ""}
        placeholder="2"
      />
      <NumberField
        name="cout_horaire"
        label="Coût horaire €"
        hint="0 si déjà compté dans les salariés."
        defaultValue={editing?.cout_horaire ?? ""}
        placeholder="25"
      />
      <NumberField
        name="frais_seance"
        label="Autres frais € / séance"
        hint="Boissons, goûter, salle..."
        defaultValue={editing?.frais_seance ?? ""}
        placeholder="15"
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          name="min_participants"
          label="Min."
          hint="Participants"
          defaultValue={editing?.min_participants ?? 2}
          placeholder="2"
        />
        <NumberField
          name="max_participants"
          label="Max."
          hint="Participants"
          defaultValue={editing?.max_participants ?? 10}
          placeholder="10"
        />
      </div>

      <div className="col-span-2 flex items-end sm:col-span-4">
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer l'atelier"}
        </button>
      </div>

      {state.error ? <p className="col-span-2 text-sm text-brand-danger sm:col-span-4">{state.error}</p> : null}
    </form>
  );
}
