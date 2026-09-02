"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createEstablishment, type FormState } from "./actions";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

const TYPES = ["Boulangerie", "Restaurant", "Bar", "Autre"] as const;

const STARTER_HINTS: Record<string, string> = {
  Boulangerie: "baguette, croissant, pain au chocolat...",
  Restaurant: "steak frites, burger, salade composée...",
  Bar: "mojito, vodka orange, bière pression...",
  Autre: "sandwich jambon-beurre, sandwich crudités-fromage...",
};

const initialState: FormState = { error: null };

export function NewEstablishmentForm() {
  const [state, formAction, pending] = useActionState(createEstablishment, initialState);
  const [type, setType] = useState<string>("Boulangerie");
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setType("Boulangerie");
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const starterHint = STARTER_HINTS[type];

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`flex flex-col gap-3 p-5 ${cardClass}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="nom" className={labelClass}>
            Nom de l&apos;établissement
          </label>
          <input
            id="nom"
            name="nom"
            type="text"
            required
            placeholder="Ex : Boulangerie du Marché"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="type" className={labelClass}>
            Type
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={inputClass}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Création..." : "Créer"}
        </button>
      </div>

      {starterHint ? (
        <label className="flex items-start gap-2 text-sm text-brand-muted">
          <input
            type="checkbox"
            name="seed_starter"
            defaultChecked
            className="mt-0.5 h-4 w-4 rounded border-brand-line accent-brand-accent"
          />
          <span>
            Ajouter des exemples de départ pour démarrer ({starterHint})
          </span>
        </label>
      ) : null}

      {state.error ? <p className="text-sm text-brand-danger">{state.error}</p> : null}
    </form>
  );
}
