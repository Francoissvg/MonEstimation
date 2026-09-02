"use client";

import { useState, useTransition } from "react";
import { updateMonthlyForecast } from "../actions";
import { inputClass } from "@/lib/ui";
import { number } from "@/lib/format";
import { MONTH_SHORT_LABELS } from "@/lib/months";

function ForecastMonthInput({
  establishmentId,
  recipeId,
  month,
  value,
  onChange,
}: {
  establishmentId: string;
  recipeId: string;
  month: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(String(value));

  const commit = () => {
    const normalized = text.trim().replace(",", ".");
    const parsed = Number(normalized);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : value;
    setText(String(next));
    if (next !== value) {
      onChange(next);
      startTransition(() => {
        updateMonthlyForecast(recipeId, establishmentId, month, next);
      });
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      disabled={pending}
      onChange={(event) => setText(event.target.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      className={`${inputClass} mt-0 w-full text-center disabled:opacity-60`}
    />
  );
}

export function RecipeForecastEditor({
  establishmentId,
  recipeId,
  initialForecasts,
}: {
  establishmentId: string;
  recipeId: string;
  initialForecasts: number[]; // 12 valeurs, index 0 = janvier
}) {
  const [forecasts, setForecasts] = useState(initialForecasts);
  const total = forecasts.reduce((sum, v) => sum + v, 0);

  const setMonth = (monthIndex: number, value: number) => {
    setForecasts((current) => {
      const next = [...current];
      next[monthIndex] = value;
      return next;
    });
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {MONTH_SHORT_LABELS.map((label, i) => (
          <div key={label} className="text-center">
            <p className="mb-1 text-xs font-medium text-brand-muted">{label}</p>
            <ForecastMonthInput
              establishmentId={establishmentId}
              recipeId={recipeId}
              month={i + 1}
              value={forecasts[i] ?? 0}
              onChange={(value) => setMonth(i, value)}
            />
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-brand-muted">
        Total annuel prévu : <strong>{number(total)}</strong> fournée(s).
      </p>
    </div>
  );
}
