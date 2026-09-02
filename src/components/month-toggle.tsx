"use client";

import { MONTH_SHORT_LABELS } from "@/lib/months";

export function MonthToggle({
  name,
  defaultValue,
  formKey,
}: {
  name: string;
  defaultValue?: number[] | null;
  formKey: string;
}) {
  const selected = new Set(defaultValue ?? []);
  return (
    <div className="flex flex-wrap gap-1" key={formKey}>
      {MONTH_SHORT_LABELS.map((label, i) => {
        const month = i + 1;
        return (
          <label key={month} className="cursor-pointer">
            <input
              type="checkbox"
              name={name}
              value={month}
              defaultChecked={selected.has(month)}
              className="peer sr-only"
            />
            <span className="inline-block rounded-md border border-brand-line px-2 py-1 text-xs text-brand-muted transition-colors peer-checked:border-brand-accent peer-checked:bg-brand-accent/10 peer-checked:text-brand-accent-dark">
              {label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
