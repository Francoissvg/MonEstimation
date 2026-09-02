"use client";

import { useTransition } from "react";
import { deleteRecipe } from "./actions";
import { dangerLinkClass } from "@/lib/ui";

export function DeleteRecipeButton({
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
        if (confirm(`Supprimer la recette "${nom}" ?`)) {
          startTransition(() => deleteRecipe(id, establishmentId));
        }
      }}
      className={dangerLinkClass}
    >
      Supprimer
    </button>
  );
}
