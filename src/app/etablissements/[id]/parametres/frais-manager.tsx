"use client";

import { useState } from "react";
import { EmployeesSection, type EmployeeRow } from "./employees-section";
import { FixedCostsSection, type FixedCostRow } from "./fixed-costs-section";
import { UtilitiesSection, type UtilityRow } from "./utilities-section";
import { StatTile } from "@/components/stat-tile";
import type { MonthlyCostsSummary } from "@/lib/costing";
import { money, number } from "@/lib/format";
import { currentMonth, MONTH_LABELS } from "@/lib/months";

const TABS = [
  { key: "employees", label: "Salariés" },
  { key: "fixed", label: "Charges fixes" },
  { key: "utilities", label: "Énergie / eau" },
  { key: "summary", label: "Résumé" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function FraisManager({
  establishmentId,
  employees,
  fixedCosts,
  utilities,
  summary,
}: {
  establishmentId: string;
  employees: EmployeeRow[];
  fixedCosts: FixedCostRow[];
  utilities: UtilityRow[];
  summary: MonthlyCostsSummary;
}) {
  const [tab, setTab] = useState<TabKey>("employees");

  return (
    <div className="space-y-5">
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-brand-line bg-brand-panel-soft/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              tab === t.key
                ? "bg-white text-brand-accent-dark shadow-sm"
                : "text-brand-muted hover:text-brand-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "employees" ? (
        <EmployeesSection establishmentId={establishmentId} employees={employees} />
      ) : null}
      {tab === "fixed" ? (
        <FixedCostsSection establishmentId={establishmentId} fixedCosts={fixedCosts} />
      ) : null}
      {tab === "utilities" ? (
        <UtilitiesSection establishmentId={establishmentId} utilities={utilities} />
      ) : null}
      {tab === "summary" ? (
        <div className="space-y-5">
          <p className="text-sm text-brand-muted">
            Calculé pour <strong>{MONTH_LABELS[currentMonth() - 1]}</strong> — les salariés et
            charges fixes limités à d&apos;autres mois n&apos;apparaissent pas dans ce total.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Total mensuel" value={money(summary.total)} tone="accent" icon="🧾" />
            <StatTile label="Salaires" value={money(summary.salary)} icon="👥" />
            <StatTile
              label="Charges fixes + énergie"
              value={money(summary.fixed + summary.utilities)}
              icon="⚡"
            />
            <StatTile label="Frais moyens / part" value={money(summary.unitOverhead)} tone="accent" icon="📊" />
          </div>
          <p className="text-sm text-brand-muted">
            Parts prévues sur le mois (toutes recettes) : <strong>{number(summary.monthlyUnits)}</strong>{" "}
            (somme du prévisionnel de vos recettes — 0 si aucune n&apos;en a).
          </p>
          <p className="text-sm text-brand-muted">
            La quote-part réellement appliquée à chaque recette n&apos;est pas cette moyenne : elle
            est proportionnelle à son chiffre d&apos;affaires prévisionnel (prix de vente ×
            prévisionnel), pour qu&apos;une recette plus chère ou plus vendue absorbe davantage de
            frais qu&apos;une recette bon marché. Sans aucun prévisionnel renseigné nulle part, aucun
            frais n&apos;est attribué aux recettes.
          </p>
        </div>
      ) : null}
    </div>
  );
}
