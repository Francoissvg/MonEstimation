"use client";

import { useState, useTransition } from "react";
import { updateWorkshopForecast } from "../actions";
import { inputClass } from "@/lib/ui";
import { money, number } from "@/lib/format";
import { MONTH_SHORT_LABELS } from "@/lib/months";

type MonthForecast = { sessions: number; participants: number };

function parse(text: string, fallback: number): number {
  const parsed = Number(text.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function MonthCell({
  establishmentId,
  workshopId,
  month,
  value,
  onChange,
}: {
  establishmentId: string;
  workshopId: string;
  month: number;
  value: MonthForecast;
  onChange: (value: MonthForecast) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [sessionsText, setSessionsText] = useState(String(value.sessions));
  const [participantsText, setParticipantsText] = useState(String(value.participants));

  // Enregistre les deux valeurs du mois ensemble dès que l'une change.
  const commit = () => {
    const next = {
      sessions: parse(sessionsText, value.sessions),
      participants: parse(participantsText, value.participants),
    };
    setSessionsText(String(next.sessions));
    setParticipantsText(String(next.participants));
    if (next.sessions !== value.sessions || next.participants !== value.participants) {
      onChange(next);
      startTransition(() => {
        updateWorkshopForecast(workshopId, establishmentId, month, next.sessions, next.participants);
      });
    }
  };

  const inputProps = {
    type: "text",
    inputMode: "decimal" as const,
    disabled: pending,
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => event.currentTarget.select(),
    onBlur: commit,
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") event.currentTarget.blur();
    },
    className: `${inputClass} mt-0 w-full px-1 text-center disabled:opacity-60`,
  };

  return (
    <div className="space-y-1">
      <span className="block text-center text-[10px] text-brand-muted lg:hidden">Séances</span>
      <input
        {...inputProps}
        value={sessionsText}
        onChange={(event) => setSessionsText(event.target.value)}
        aria-label="Séances"
        title="Nombre de séances"
      />
      <span className="block text-center text-[10px] text-brand-muted lg:hidden">Participants</span>
      <input
        {...inputProps}
        value={participantsText}
        onChange={(event) => setParticipantsText(event.target.value)}
        aria-label="Participants par séance"
        title="Participants moyens par séance"
      />
    </div>
  );
}

export function WorkshopForecastEditor({
  establishmentId,
  workshopId,
  prixParticipant,
  initialForecasts,
}: {
  establishmentId: string;
  workshopId: string;
  prixParticipant: number;
  initialForecasts: MonthForecast[]; // 12 valeurs, index 0 = janvier
}) {
  const [forecasts, setForecasts] = useState(initialForecasts);
  const totalSessions = forecasts.reduce((sum, f) => sum + f.sessions, 0);
  const totalParticipants = forecasts.reduce((sum, f) => sum + f.sessions * f.participants, 0);

  return (
    <div>
      <div className="flex gap-2">
        {/* Grand écran : libellés en colonne à gauche ; sinon, au-dessus de chaque champ. */}
        <div className="hidden shrink-0 pt-6 text-xs font-medium text-brand-muted lg:block">
          <p className="flex h-[38px] items-center">Séances</p>
          <p className="mt-1 flex h-[38px] items-center">Participants</p>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
          {MONTH_SHORT_LABELS.map((label, i) => (
            <div key={label}>
              <p className="mb-1 text-center text-xs font-medium text-brand-muted">{label}</p>
              <MonthCell
                establishmentId={establishmentId}
                workshopId={workshopId}
                month={i + 1}
                value={forecasts[i]}
                onChange={(value) =>
                  setForecasts((current) => current.map((f, index) => (index === i ? value : f)))
                }
              />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-brand-muted">
        Sur l&apos;année : <strong>{number(totalSessions)}</strong> séance(s),{" "}
        <strong>{number(totalParticipants)}</strong> participant(s), soit{" "}
        <strong>{money(totalParticipants * prixParticipant)}</strong> de chiffre d&apos;affaires.
      </p>
    </div>
  );
}
