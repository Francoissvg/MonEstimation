"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { deleteSupplier, saveSupplier, type FormState } from "./actions";
import { cardClass, dangerLinkClass, inputClass, labelClass, primaryButtonClass } from "@/lib/ui";

export type SupplierRow = {
  id: string;
  nom: string;
  contact: string;
};

const initialState: FormState = { error: null };

export function SuppliersManager({
  establishmentId,
  suppliers,
  purchaseCountBySupplier,
}: {
  establishmentId: string;
  suppliers: SupplierRow[];
  purchaseCountBySupplier: Record<string, number>;
}) {
  const [state, formAction, pending] = useActionState(saveSupplier, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const editing = suppliers.find((s) => s.id === editingId) ?? null;

  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setEditingId(null);
    }
    wasPending.current = pending;
  }, [pending, state.error]);

  return (
    <details className={`group p-5 ${cardClass}`}>
      <summary className="cursor-pointer list-none text-sm font-semibold text-brand-ink">
        <span className="inline-flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90">▸</span>
          Fournisseurs{suppliers.length ? ` (${suppliers.length})` : ""}
        </span>
      </summary>
      <p className="mt-2 text-xs text-brand-muted">
        Associez un fournisseur à chaque achat (dans l&apos;historique d&apos;un ingrédient) pour
        comparer leurs prix.
      </p>

      <form
        ref={formRef}
        action={formAction}
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <input type="hidden" name="establishment_id" value={establishmentId} />
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <div className="flex-1">
          <label className={labelClass}>Nom</label>
          <input
            name="nom"
            required
            defaultValue={editing?.nom ?? ""}
            key={`nom-${editing?.id ?? "new"}`}
            className={inputClass}
          />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Contact</label>
          <input
            name="contact"
            placeholder="Téléphone, email..."
            defaultValue={editing?.contact ?? ""}
            key={`contact-${editing?.id ?? "new"}`}
            className={inputClass}
          />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Enregistrement..." : editing ? "Mettre à jour" : "Ajouter"}
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
        </div>
      </form>
      {state.error ? <p className="mt-2 text-sm text-brand-danger">{state.error}</p> : null}

      {suppliers.length ? (
        <ul className="mt-4 divide-y divide-brand-line/60">
          {suppliers.map((supplier) => (
            <li key={supplier.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div>
                <p className="font-medium text-brand-ink">{supplier.nom}</p>
                <p className="text-xs text-brand-muted">
                  {supplier.contact || "Pas de contact renseigné"} ·{" "}
                  {purchaseCountBySupplier[supplier.id] ?? 0} achat(s)
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingId(supplier.id)}
                  className="text-sm text-brand-muted hover:underline"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(`Supprimer "${supplier.nom}" ?`)) {
                      startTransition(() => deleteSupplier(supplier.id, establishmentId));
                    }
                  }}
                  className={dangerLinkClass}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-brand-muted">Aucun fournisseur pour l&apos;instant.</p>
      )}
    </details>
  );
}
