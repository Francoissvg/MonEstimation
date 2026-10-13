"use client";

import { secondaryButtonClass } from "@/lib/ui";
import type { Vocabulary } from "@/lib/vocabulary";
import { useVocabulary } from "@/components/vocabulary-provider";

export type RapportExportData = {
  month: string;
  currentTotals: { revenue: number; cost: number; margin: number };
  prevTotals: { revenue: number; cost: number; margin: number };
  marginByRecipe: { nom: string; tauxMargeBrute: number; tauxMarge: number }[];
  overhead: { label: string; value: number }[];
  caVsCout: { nom: string; ca: number; cout: number }[];
  forecastVsActual: { nom: string; previsionnel: number; realise: number }[];
  annualRevenue: { mois: string; ca: number; cumul: number }[];
  stockNeeds: { nom: string; quantite: string; cout: number }[];
};

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[;"\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatNumber(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

// Séparateur point-virgule + décimales à la virgule : convention Excel en locale française.
function buildCsv(data: RapportExportData, vocab: Vocabulary): string {
  const lines: string[] = [];
  const row = (...cells: (string | number)[]) => lines.push(cells.map(csvEscape).join(";"));

  row(`Rapport — ${data.month}`);
  lines.push("");

  row("Résumé du mois", "Ce mois", "Mois précédent");
  row("CA prévisionnel (€)", formatNumber(data.currentTotals.revenue), formatNumber(data.prevTotals.revenue));
  row("Coût total (€)", formatNumber(data.currentTotals.cost), formatNumber(data.prevTotals.cost));
  row("Marge (€)", formatNumber(data.currentTotals.margin), formatNumber(data.prevTotals.margin));
  lines.push("");

  row(`Marge par ${vocab.recipeLower}`, "Taux de marge brute (%, sans les frais)", "Taux de marge (%)");
  for (const r of data.marginByRecipe) row(r.nom, formatNumber(r.tauxMargeBrute), formatNumber(r.tauxMarge));
  lines.push("");

  row("Répartition des frais généraux", "Montant (€)");
  for (const o of data.overhead) row(o.label, formatNumber(o.value));
  lines.push("");

  row(`CA vs coût projeté par ${vocab.recipeLower}`, "CA (€)", "Coût (€)");
  for (const c of data.caVsCout) row(c.nom, formatNumber(c.ca), formatNumber(c.cout));
  lines.push("");

  row("Prévisionnel vs réalisé (cumul depuis janvier)", "Prévisionnel", "Réalisé");
  for (const f of data.forecastVsActual) row(f.nom, formatNumber(f.previsionnel), formatNumber(f.realise));
  lines.push("");

  row("Prévisionnel annuel", "CA du mois (€)", "Cumul (€)");
  for (const a of data.annualRevenue) row(a.mois, formatNumber(a.ca), formatNumber(a.cumul));
  lines.push("");

  row("Besoins en approvisionnement", "Quantité nécessaire", "Coût estimé (€)");
  for (const s of data.stockNeeds) row(s.nom, s.quantite, formatNumber(s.cout));

  return lines.join("\r\n");
}

export function ExportExcelButton({ data }: { data: RapportExportData }) {
  const vocab = useVocabulary();
  const handleClick = () => {
    const csv = buildCsv(data, vocab);
    const bom = "﻿";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport-${data.month.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" onClick={handleClick} className={`print:hidden ${secondaryButtonClass}`}>
      Exporter en Excel
    </button>
  );
}
