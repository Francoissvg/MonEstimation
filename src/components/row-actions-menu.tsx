"use client";

import { useEffect, useRef, useState } from "react";

export type RowAction = {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  disabled?: boolean;
};

// Menu déroulant compact pour les actions de ligne d'un tableau (au lieu
// d'empiler plusieurs liens/boutons côte à côte). Défile si la liste s'allonge.
export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md px-2 py-1 text-brand-muted transition-colors hover:bg-brand-panel-soft hover:text-brand-ink"
        aria-label="Actions"
        aria-expanded={open}
      >
        ⋯
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 max-h-56 w-44 overflow-y-auto rounded-lg border border-brand-line bg-white py-1 shadow-lg">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
                action.tone === "danger"
                  ? "text-brand-danger hover:bg-brand-danger-bg"
                  : "text-brand-ink hover:bg-brand-panel-soft"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
