"use client";

import { useState, useTransition } from "react";
import { saveHistorySnapshot } from "./actions";
import { secondaryButtonClass } from "@/lib/ui";

export function SaveHistoryButton({
  establishmentId,
  recipeId,
}: {
  establishmentId: string;
  recipeId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await saveHistorySnapshot(establishmentId, recipeId);
            setMessage(result.error ?? "Calcul enregistré dans l'historique.");
          });
        }}
        className={secondaryButtonClass}
      >
        {pending ? "Enregistrement..." : "Enregistrer dans l'historique"}
      </button>
      {message ? <p className="text-sm text-brand-muted">{message}</p> : null}
    </div>
  );
}
