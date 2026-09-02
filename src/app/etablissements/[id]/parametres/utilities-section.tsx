"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteUtility, saveUtility, type FormState } from "./actions";
import { cardClass, inputClass, labelClass, primaryButtonClass, tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { money } from "@/lib/format";
import { compareValues, toggleSort, type SortState } from "@/lib/sort";
import { SortHeader } from "@/components/sort-header";

type SortKey = "recorded_at" | "type" | "prix";

export type UtilityRow = {
  id: string;
  type: string;
  recorded_at: string;
  consumption: number;
  unite: string;
  prix: number;
  note: string;
};

const TYPE_LABELS: Record<string, string> = {
  electricite: "Électricité",
  gaz: "Gaz",
  eau: "Eau",
};

const initialState: FormState = { error: null };

export function UtilitiesSection({
  establishmentId,
  utilities,
}: {
  establishmentId: string;
  utilities: UtilityRow[];
}) {
  const [state, formAction, pending] = useActionState(saveUtility, initialState);
  const [busy, startTransition] = useTransition();
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "recorded_at", direction: "desc" });
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const rows = useMemo(
    () =>
      [...utilities].sort((a, b) => {
        const value = compareValues(a[sort.key], b[sort.key]);
        return sort.direction === "asc" ? value : -value;
      }),
    [utilities, sort]
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
    <div className="space-y-4">
      <form
        ref={formRef}
        action={formAction}
        className={`grid grid-cols-2 gap-3 p-5 sm:grid-cols-5 ${cardClass}`}
      >
        <input type="hidden" name="establishment_id" value={establishmentId} />

        <div>
          <label className={labelClass}>Type</label>
          <select name="type" defaultValue="electricite" className={inputClass}>
            <option value="electricite">Électricité</option>
            <option value="gaz">Gaz</option>
            <option value="eau">Eau</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input name="recorded_at" type="date" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Consommation</label>
          <input name="consumption" type="text" inputMode="decimal" required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Unité</label>
          <input name="unite" defaultValue="kWh" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Prix €</label>
          <input name="prix" type="text" inputMode="decimal" required className={inputClass} />
        </div>

        <div className="col-span-2 flex items-end gap-2 sm:col-span-5">
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Ajout..." : "Ajouter"}
          </button>
          {state.error ? <p className="text-sm text-brand-danger">{state.error}</p> : null}
        </div>
      </form>

      <div className={tableWrapClass}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3">{header("recorded_at", "Date")}</th>
              <th className="px-4 py-3">{header("type", "Type")}</th>
              <th className="px-4 py-3">Consommation</th>
              <th className="px-4 py-3">{header("prix", "Prix")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((utility) => (
                <tr key={utility.id} className={tableRowClass}>
                  <td className="px-4 py-3 text-brand-muted">{utility.recorded_at}</td>
                  <td className="px-4 py-3 font-medium text-brand-ink">
                    {TYPE_LABELS[utility.type] ?? utility.type}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">
                    {utility.consumption} {utility.unite}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{money(utility.prix)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (confirm("Supprimer cette entrée ?")) {
                          startTransition(() => deleteUtility(utility.id, establishmentId));
                        }
                      }}
                      className="text-sm text-brand-danger hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-muted">
                  Aucune consommation enregistrée pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
