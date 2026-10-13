"use client";

import { useTransition } from "react";
import { deleteWorkshop } from "./actions";
import { dangerLinkClass } from "@/lib/ui";

export function DeleteWorkshopButton({
  id,
  establishmentId,
  nom,
}: {
  id: string;
  establishmentId: string;
  nom: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        if (confirm(`Supprimer l'atelier "${nom}" ?`)) {
          startTransition(() => deleteWorkshop(id, establishmentId));
        }
      }}
      className={dangerLinkClass}
    >
      Supprimer
    </button>
  );
}
