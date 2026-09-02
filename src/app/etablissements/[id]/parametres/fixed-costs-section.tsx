"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  deleteFixedCost,
  saveFixedCost,
  toggleFixedCostActive,
  type FormState,
} from "./actions";
import { cardClass, inputClass, labelClass, primaryButtonClass, tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { money } from "@/lib/format";
import { compareValues, toggleSort, type SortState } from "@/lib/sort";
import { SortHeader } from "@/components/sort-header";
import { SearchInput } from "@/components/search-input";
import { MonthToggle } from "@/components/month-toggle";

type SortKey = "nom" | "categorie" | "monthlyAmount";

export type FixedCostRow = {
  id: string;
  nom: string;
  montant: number;
  frequence: string;
  categorie: string;
  note: string;
  active: boolean;
  active_months: number[] | null;
};

function monthlyAmount(cost: FixedCostRow): number {
  return cost.frequence === "annuel" ? cost.montant / 12 : cost.montant;
}

const initialState: FormState = { error: null };

export function FixedCostsSection({
  establishmentId,
  fixedCosts,
}: {
  establishmentId: string;
  fixedCosts: FixedCostRow[];
}) {
  const [state, formAction, pending] = useActionState(saveFixedCost, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "nom", direction: "asc" });
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const editing = fixedCosts.find((c) => c.id === editingId) ?? null;

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setEditingId(null);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? fixedCosts.filter(
          (cost) =>
            cost.nom.toLowerCase().includes(query) || cost.categorie.toLowerCase().includes(query)
        )
      : fixedCosts;
    return [...filtered].sort((a, b) => {
      const value =
        sort.key === "monthlyAmount"
          ? compareValues(monthlyAmount(a), monthlyAmount(b))
          : compareValues(a[sort.key], b[sort.key]);
      return sort.direction === "asc" ? value : -value;
    });
  }, [fixedCosts, search, sort]);

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
        className={`grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 ${cardClass}`}
      >
        <input type="hidden" name="establishment_id" value={establishmentId} />
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

        <div className="col-span-2">
          <label className={labelClass}>Nom</label>
          <input
            name="nom"
            required
            defaultValue={editing?.nom ?? ""}
            key={`nom-${editing?.id ?? "new"}`}
            placeholder="Ex : Loyer"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Montant €</label>
          <input
            name="montant"
            type="text"
            inputMode="decimal"
            required
            defaultValue={editing?.montant ?? ""}
            key={`montant-${editing?.id ?? "new"}`}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Fréquence</label>
          <select
            name="frequence"
            defaultValue={editing?.frequence ?? "mensuel"}
            key={`freq-${editing?.id ?? "new"}`}
            className={inputClass}
          >
            <option value="mensuel">Mensuel</option>
            <option value="annuel">Annuel</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Catégorie</label>
          <input
            name="categorie"
            defaultValue={editing?.categorie ?? "Général"}
            key={`cat-${editing?.id ?? "new"}`}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Note</label>
          <input
            name="note"
            defaultValue={editing?.note ?? ""}
            key={`note-${editing?.id ?? "new"}`}
            className={inputClass}
          />
        </div>

        <div className="col-span-2 sm:col-span-4">
          <label className={labelClass}>Mois actifs</label>
          <p className="mt-1 text-xs text-brand-muted">
            Aucune sélection = actif toute l&apos;année. Cochez uniquement les mois concernés (ex :
            chauffage l&apos;hiver).
          </p>
          <div className="mt-2">
            <MonthToggle
              name="active_months"
              defaultValue={editing?.active_months}
              formKey={editing?.id ?? "new"}
            />
          </div>
        </div>

        <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Enregistrement..." : editing ? "Mettre à jour" : "Ajouter la charge"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="text-sm text-brand-muted hover:underline"
            >
              Annuler
            </button>
          ) : null}
          {state.error ? <p className="text-sm text-brand-danger">{state.error}</p> : null}
        </div>
      </form>

      <div className="max-w-xs">
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une charge..." />
      </div>

      <div className={tableWrapClass}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3">{header("nom", "Nom")}</th>
              <th className="px-4 py-3">{header("categorie", "Catégorie")}</th>
              <th className="px-4 py-3">{header("monthlyAmount", "Montant / mois")}</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((cost) => (
                <tr key={cost.id} className={tableRowClass}>
                  <td className="px-4 py-3 font-medium text-brand-ink">{cost.nom}</td>
                  <td className="px-4 py-3 text-brand-muted">{cost.categorie}</td>
                  <td className="px-4 py-3 text-brand-muted">{money(monthlyAmount(cost))}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        startTransition(() =>
                          toggleFixedCostActive(cost.id, establishmentId, !cost.active)
                        )
                      }
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        cost.active
                          ? "bg-brand-success-bg text-brand-success"
                          : "bg-brand-panel-soft text-brand-muted"
                      }`}
                    >
                      {cost.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(cost.id)}
                      className="text-sm text-brand-muted hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (confirm(`Supprimer "${cost.nom}" ?`)) {
                          startTransition(() => deleteFixedCost(cost.id, establishmentId));
                        }
                      }}
                      className="ml-3 text-sm text-brand-danger hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-brand-muted">
                  {fixedCosts.length ? "Aucun résultat." : "Aucune charge fixe pour l'instant."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
