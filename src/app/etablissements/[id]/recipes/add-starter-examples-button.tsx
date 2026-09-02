"use client";

import { useState, useTransition } from "react";
import { addStarterExamples } from "./actions";
import { secondaryButtonClass } from "@/lib/ui";

export function AddStarterExamplesButton({
  establishmentId,
  type,
}: {
  establishmentId: string;
  type: string;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMessage(null);
          startTransition(async () => {
            const result = await addStarterExamples(establishmentId, type);
            setMessage(result.error ?? "Exemples ajoutés !");
          });
        }}
        className={secondaryButtonClass}
      >
        {pending ? "Ajout..." : `Ajouter des exemples de ${type.toLowerCase()}`}
      </button>
      {message ? <p className="text-sm text-brand-muted">{message}</p> : null}
    </div>
  );
}
