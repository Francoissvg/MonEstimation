"use client";

import { useTransition } from "react";
import { deleteRecipe } from "./actions";
import { dangerLinkClass } from "@/lib/ui";
import { useVocabulary } from "@/components/vocabulary-provider";

export function DeleteRecipeButton({
  id,
  establishmentId,
  nom,
}: {
  id: string;
  establishmentId: string;
  nom: string;
}) {
  const vocab = useVocabulary();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        if (confirm(`Supprimer la ${vocab.recipeLower} "${nom}" ?`)) {
          startTransition(() => deleteRecipe(id, establishmentId));
        }
      }}
      className={dangerLinkClass}
    >
      Supprimer
    </button>
  );
}
