"use client";

import { useTransition } from "react";
import { deleteEstablishment } from "./actions";
import { dangerLinkClass } from "@/lib/ui";

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Supprimer cet établissement et toutes ses données ?")) {
          startTransition(() => deleteEstablishment(id));
        }
      }}
      className={dangerLinkClass}
    >
      Supprimer
    </button>
  );
}
