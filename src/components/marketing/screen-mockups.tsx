// Illustrations stylisées des écrans de l'application, utilisées sur la page
// d'accueil publique et le panneau de connexion. Ce ne sont pas de vraies
// captures d'écran : des maquettes avec des exemples réalistes (valeurs
// imaginaires), volontairement variées (boulangerie, restaurant, traiteur)
// pour montrer que l'outil ne se limite pas à un seul métier.
import type { ReactNode } from "react";

function ScreenFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-brand-line bg-white shadow-[0_1px_2px_rgba(23,32,42,0.04),0_24px_48px_-24px_rgba(23,32,42,0.22)]">
      <div className="flex items-center gap-1.5 border-b border-brand-line bg-brand-panel-soft/70 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-brand-line" />
        <span className="h-2 w-2 rounded-full bg-brand-line" />
        <span className="h-2 w-2 rounded-full bg-brand-line" />
        <span className="ml-2 truncate text-[10px] font-medium text-brand-muted">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function DashboardMockup() {
  const bars = [
    { m: "Fév", h: 40 },
    { m: "Mar", h: 65 },
    { m: "Avr", h: 30 },
    { m: "Mai", h: 80 },
    { m: "Juin", h: 55 },
    { m: "Juil", h: 70 },
    { m: "Août", h: 45 },
  ];
  const stats = [
    { label: "CA prévisionnel", value: "12 480 €", tone: "accent" },
    { label: "Frais généraux", value: "3 240 €", tone: "ink" },
    { label: "Coût total", value: "7 960 €", tone: "ink" },
    { label: "Marge", value: "4 520 €", tone: "accent" },
  ] as const;
  const recipes = [
    { name: "Baguette tradition", rate: "72 %", tone: "good" },
    { name: "Tarte aux pommes", rate: "64 %", tone: "good" },
    { name: "Plat du jour", rate: "58 %", tone: "good" },
    { name: "Sandwich jambon-beurre", rate: "38 %", tone: "bad" },
  ] as const;

  return (
    <ScreenFrame title="Tableau de bord — Août 2026">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-brand-line bg-brand-panel-soft/60 p-2">
            <p className="truncate text-[9px] font-medium text-brand-muted">{s.label}</p>
            <p className={`mt-1 text-xs font-semibold ${s.tone === "accent" ? "text-brand-accent-dark" : "text-brand-ink"}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex h-20 items-end gap-1.5 rounded-lg border border-brand-line bg-brand-panel-soft/40 p-2">
        {bars.map((b, i) => (
          <div key={i} className="flex-1 rounded-t bg-brand-accent/70" style={{ height: `${b.h}%` }} />
        ))}
      </div>
      <div className="mt-1 flex gap-1.5 px-2">
        {bars.map((b, i) => (
          <span key={i} className="flex-1 text-center text-[8px] text-brand-muted">
            {b.m}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[9px] font-semibold uppercase tracking-wide text-brand-muted">Marge par recette</p>
      <div className="mt-1.5 space-y-1.5">
        {recipes.map((r) => (
          <div key={r.name} className="flex items-center justify-between rounded-lg border border-brand-line px-2 py-1.5">
            <span className="truncate text-[10px] text-brand-ink">{r.name}</span>
            <span
              className={`shrink-0 text-[10px] font-semibold ${r.tone === "bad" ? "text-brand-danger" : "text-brand-accent-dark"}`}
            >
              {r.rate}
            </span>
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}

export function FraisMockup() {
  const rows = [
    { label: "Salaires", value: "2 680 €", share: 58 },
    { label: "Charges fixes", value: "560 €", share: 12 },
    { label: "Énergie", value: "420 €", share: 30 },
  ];

  return (
    <ScreenFrame title="Frais généraux — Août 2026">
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between rounded-lg border border-brand-line px-2 py-1.5">
            <span className="text-[10px] text-brand-ink">{r.label}</span>
            <span className="text-[10px] font-medium text-brand-muted">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex h-2.5 overflow-hidden rounded-full">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={i === 0 ? "bg-brand-accent" : i === 1 ? "bg-brand-accent/60" : "bg-brand-accent/30"}
            style={{ width: `${r.share}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-brand-line pt-2">
        <span className="text-[10px] font-semibold text-brand-ink">Total réparti sur vos recettes</span>
        <span className="text-xs font-semibold text-brand-accent-dark">3 660 €</span>
      </div>
    </ScreenFrame>
  );
}

export function IngredientsMockup() {
  const rows = [
    { name: "Farine T65", price: "1,42 €/kg" },
    { name: "Filet de poulet", price: "8,90 €/kg" },
    { name: "Crème fraîche", price: "3,10 €/l" },
    { name: "Chocolat noir", price: "12,50 €/kg" },
  ];
  return (
    <ScreenFrame title="Ingrédients">
      <div className="flex items-center justify-between border-b border-brand-line pb-2">
        <span className="text-[11px] font-semibold text-brand-ink">Ingrédients</span>
        <div className="flex h-5 w-16 items-center justify-center rounded-md bg-brand-accent/80 text-[9px] font-medium text-white">
          + Ajouter
        </div>
      </div>
      <div className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-2 rounded-lg px-1 py-1.5 odd:bg-brand-panel-soft/50">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-accent/60" />
            <span className="truncate text-[10px] text-brand-ink">{row.name}</span>
            <span className="ml-auto shrink-0 text-[10px] font-medium text-brand-muted">{row.price}</span>
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}

export function RecipeMockup() {
  const ingredientRows = [
    { name: "Pommes", value: "0,54 €" },
    { name: "Farine T65", value: "0,21 €" },
    { name: "Beurre AOP", value: "0,49 €" },
  ];
  const costCards = [
    { label: "Coût matière", value: "1,24 €", tone: "ink" as const },
    { label: "Frais associés", value: "0,31 €", tone: "ink" as const },
    { label: "Marge / part", value: "2,45 € (61 %)", tone: "accent" as const },
  ];
  return (
    <ScreenFrame title="Tarte aux pommes — coût de revient">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          {ingredientRows.map((row) => (
            <div key={row.name} className="flex items-center justify-between rounded-lg border border-brand-line px-2 py-1.5">
              <span className="truncate text-[10px] text-brand-ink">{row.name}</span>
              <span className="shrink-0 text-[10px] font-medium text-brand-muted">{row.value}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {costCards.map((c) => (
            <div key={c.label} className="rounded-lg border border-brand-line bg-brand-panel-soft/50 p-2">
              <p className="text-[9px] font-medium text-brand-muted">{c.label}</p>
              <p className={`mt-1 text-xs font-semibold ${c.tone === "accent" ? "text-brand-accent-dark" : "text-brand-ink"}`}>
                {c.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ScreenFrame>
  );
}

export function PlanningMockup() {
  const months = ["Mars", "Avr", "Mai", "Juin", "Juil", "Août"];
  const recipes = [
    { name: "Baguette tradition", values: [340, 380, 420, 460, 410, 390] },
    { name: "Tarte aux pommes", values: [60, 70, 90, 120, 100, 80] },
    { name: "Plat du jour", values: [200, 210, 240, 260, 230, 220] },
  ];
  const stockNeeds = [
    { name: "Farine T65", qty: "84 kg" },
    { name: "Beurre AOP", qty: "32 kg" },
    { name: "Filet de poulet", qty: "18 kg" },
  ];

  return (
    <ScreenFrame title="Prévisionnel 2026">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-brand-ink">Grille de saisie</span>
        <span className="text-[9px] text-brand-muted">Mars → Août</span>
      </div>

      <div className="mt-2 overflow-hidden rounded-lg border border-brand-line">
        <div className="grid grid-cols-[1.3fr_repeat(6,minmax(0,1fr))] bg-brand-panel-soft/70 text-[8px] font-medium text-brand-muted">
          <span className="px-1.5 py-1">Recette</span>
          {months.map((m) => (
            <span key={m} className="px-1 py-1 text-center">
              {m}
            </span>
          ))}
        </div>
        {recipes.map((r) => (
          <div
            key={r.name}
            className="grid grid-cols-[1.3fr_repeat(6,minmax(0,1fr))] border-t border-brand-line text-[8px]"
          >
            <span className="truncate px-1.5 py-1 text-brand-ink">{r.name}</span>
            {r.values.map((v, i) => (
              <span key={i} className="px-1 py-1 text-center text-brand-muted">
                {v}
              </span>
            ))}
          </div>
        ))}
      </div>

      <p className="mt-3 text-[9px] font-semibold uppercase tracking-wide text-brand-muted">
        Besoins en approvisionnement — Août
      </p>
      <div className="mt-1.5 space-y-1.5">
        {stockNeeds.map((s) => (
          <div key={s.name} className="flex items-center justify-between rounded-lg border border-brand-line px-2 py-1.5">
            <span className="text-[10px] text-brand-ink">{s.name}</span>
            <span className="text-[10px] font-medium text-brand-accent-dark">{s.qty}</span>
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}

export function RapportMockup() {
  const stats = [
    { label: "Marge moyenne", value: "64 %" },
    { label: "CA annuel", value: "148 200 €" },
    { label: "Frais annuels", value: "38 900 €" },
  ];
  const priceChanges = [
    { name: "Farine T65", change: "+4,2 %", tone: "bad" },
    { name: "Beurre AOP", change: "+7,8 %", tone: "bad" },
    { name: "Filet de poulet", change: "-1,5 %", tone: "good" },
  ] as const;

  return (
    <ScreenFrame title="Rapport">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-brand-ink">Prévisionnel annuel</span>
        <div className="flex gap-1.5">
          <div className="flex h-5 w-12 items-center justify-center rounded-md border border-brand-line text-[8px] font-medium text-brand-muted">
            PDF
          </div>
          <div className="flex h-5 w-12 items-center justify-center rounded-md border border-brand-line text-[8px] font-medium text-brand-muted">
            Excel
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-brand-line bg-brand-panel-soft/50 px-1.5 py-1">
            <p className="truncate text-[8px] text-brand-muted">{s.label}</p>
            <p className="text-[10px] font-semibold text-brand-accent-dark">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-1.5">
        <div className="flex h-24 flex-col justify-between py-1 text-right text-[8px] text-brand-muted">
          <span>15 000 €</span>
          <span>0 €</span>
        </div>
        <svg viewBox="0 0 240 90" className="h-24 flex-1">
          <polyline
            points="0,70 40,60 80,64 120,42 160,48 200,20 240,26"
            fill="none"
            stroke="#256d85"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="0,84 40,80 80,74 120,66 160,54 200,40 240,18"
            fill="none"
            stroke="#eda100"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        </svg>
      </div>
      <div className="mt-1 flex items-center justify-between text-[8px] text-brand-muted">
        <span>Jan</span>
        <span>Déc</span>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[10px] text-brand-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-[#256d85]" /> CA du mois
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-[#eda100]" /> Cumulé
        </span>
      </div>

      <p className="mt-3 text-[9px] font-semibold uppercase tracking-wide text-brand-muted">
        Évolution des prix d&apos;achat
      </p>
      <div className="mt-1.5 space-y-1.5">
        {priceChanges.map((p) => (
          <div key={p.name} className="flex items-center justify-between rounded-lg border border-brand-line px-2 py-1.5">
            <span className="text-[10px] text-brand-ink">{p.name}</span>
            <span
              className={`text-[10px] font-semibold ${p.tone === "bad" ? "text-brand-danger" : "text-brand-success"}`}
            >
              {p.change}
            </span>
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}
