"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  deleteEmployee,
  saveEmployee,
  toggleEmployeeActive,
  type FormState,
} from "./actions";
import { cardClass, inputClass, labelClass, primaryButtonClass, tableWrapClass, tableHeadClass, tableRowClass } from "@/lib/ui";
import { money } from "@/lib/format";
import { compareValues, toggleSort, type SortState } from "@/lib/sort";
import { SortHeader } from "@/components/sort-header";
import { SearchInput } from "@/components/search-input";
import { MonthToggle } from "@/components/month-toggle";

type SortKey = "nom" | "salary_mode" | "monthlyCost";

export type EmployeeRow = {
  id: string;
  nom: string;
  salary_mode: string;
  hourly_rate: number;
  hours_per_week: number;
  monthly_salary: number;
  note: string;
  active: boolean;
  active_months: number[] | null;
};

function monthlyCost(employee: EmployeeRow): number {
  return employee.salary_mode === "mensuel"
    ? employee.monthly_salary
    : employee.hourly_rate * employee.hours_per_week * 4.33;
}

const initialState: FormState = { error: null };

export function EmployeesSection({
  establishmentId,
  employees,
}: {
  establishmentId: string;
  employees: EmployeeRow[];
}) {
  const [state, formAction, pending] = useActionState(saveEmployee, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "nom", direction: "asc" });
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const editing = employees.find((e) => e.id === editingId) ?? null;

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
      ? employees.filter((employee) => employee.nom.toLowerCase().includes(query))
      : employees;
    return [...filtered].sort((a, b) => {
      const value =
        sort.key === "monthlyCost"
          ? compareValues(monthlyCost(a), monthlyCost(b))
          : compareValues(a[sort.key], b[sort.key]);
      return sort.direction === "asc" ? value : -value;
    });
  }, [employees, search, sort]);

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
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Mode de salaire</label>
          <select
            name="salary_mode"
            defaultValue={editing?.salary_mode ?? "horaire"}
            key={`mode-${editing?.id ?? "new"}`}
            className={inputClass}
          >
            <option value="horaire">Horaire</option>
            <option value="mensuel">Mensuel</option>
          </select>
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
        <div>
          <label className={labelClass}>Taux horaire €</label>
          <input
            name="hourly_rate"
            type="text"
            inputMode="decimal"
            defaultValue={editing?.hourly_rate ?? ""}
            key={`hourly-${editing?.id ?? "new"}`}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Heures / semaine</label>
          <input
            name="hours_per_week"
            type="text"
            inputMode="decimal"
            defaultValue={editing?.hours_per_week ?? 35}
            key={`hours-${editing?.id ?? "new"}`}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Salaire mensuel €</label>
          <input
            name="monthly_salary"
            type="text"
            inputMode="decimal"
            defaultValue={editing?.monthly_salary ?? ""}
            key={`monthly-${editing?.id ?? "new"}`}
            className={inputClass}
          />
        </div>

        <div className="col-span-2 sm:col-span-4">
          <label className={labelClass}>Mois actifs</label>
          <p className="mt-1 text-xs text-brand-muted">
            Aucune sélection = actif toute l&apos;année. Cochez uniquement les mois d&apos;un
            contrat saisonnier.
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
            {pending ? "Enregistrement..." : editing ? "Mettre à jour" : "Ajouter le salarié"}
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
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un salarié..." />
      </div>

      <div className={tableWrapClass}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3">{header("nom", "Nom")}</th>
              <th className="px-4 py-3">{header("salary_mode", "Mode")}</th>
              <th className="px-4 py-3">{header("monthlyCost", "Coût mensuel")}</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((employee) => (
                <tr key={employee.id} className={tableRowClass}>
                  <td className="px-4 py-3 font-medium text-brand-ink">{employee.nom}</td>
                  <td className="px-4 py-3 text-brand-muted">
                    {employee.salary_mode === "mensuel" ? "Mensuel" : "Horaire"}
                  </td>
                  <td className="px-4 py-3 text-brand-muted">{money(monthlyCost(employee))}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        startTransition(() =>
                          toggleEmployeeActive(employee.id, establishmentId, !employee.active)
                        )
                      }
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        employee.active
                          ? "bg-brand-success-bg text-brand-success"
                          : "bg-brand-panel-soft text-brand-muted"
                      }`}
                    >
                      {employee.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(employee.id)}
                      className="text-sm text-brand-muted hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        if (confirm(`Supprimer "${employee.nom}" ?`)) {
                          startTransition(() => deleteEmployee(employee.id, establishmentId));
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
                  {employees.length ? "Aucun résultat." : "Aucun salarié pour l'instant."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
