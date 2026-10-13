"use client";

import { secondaryButtonClass } from "@/lib/ui";
import type { Vocabulary } from "@/lib/vocabulary";
import { useVocabulary } from "@/components/vocabulary-provider";

export type FullExportData = {
  establishmentNom: string;
  month: string;
  ingredients: { nom: string; categorie: string; prixAchat: number; coutUnitaire: number; unite: string }[];
  recipes: { nom: string; prixVente: number; unitCost: number; margin: number; marginRate: number }[];
  fraisGeneraux: { salaires: number; chargesFixes: number; energie: number; total: number };
  employees: { nom: string; mode: string; coutMensuel: number; actif: boolean }[];
  fixedCosts: { nom: string; montant: number; frequence: string; actif: boolean }[];
  previsionnel: { nom: string; parMois: number[]; total: number }[];
  rapportResume: {
    currentTotals: { revenue: number; cost: number; margin: number };
    prevTotals: { revenue: number; cost: number; margin: number };
  };
  rapportPrevisionnelVsRealise: { nom: string; previsionnel: number; realise: number }[];
  rapportAnnuel: { mois: string; ca: number; cumul: number }[];
  historique: { date: string; recette: string; coutRevient: number; prixVente: number; marge: number; tauxMarge: number }[];
  fournisseurs: { ingredientNom: string; supplierNom: string; firstPrice: number; lastPrice: number; changeRate: number; usageUnit: string }[];
};

const MONTH_HEADERS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

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

function buildCsv(data: FullExportData, vocab: Vocabulary): string {
  const lines: string[] = [];
  const row = (...cells: (string | number)[]) => lines.push(cells.map(csvEscape).join(";"));
  const blank = () => lines.push("");

  row(`Export complet — ${data.establishmentNom} — ${data.month}`);
  blank();

  row(vocab.ingredients, "Catégorie", "Prix d'achat (€)", "Coût unitaire (€)", "Unité");
  for (const i of data.ingredients) row(i.nom, i.categorie, formatNumber(i.prixAchat), formatNumber(i.coutUnitaire), i.unite);
  blank();

  row(vocab.recipes, "Prix vente (€)", "Coût revient (€)", "Marge (€)", "Taux de marge (%)");
  for (const r of data.recipes) row(r.nom, formatNumber(r.prixVente), formatNumber(r.unitCost), formatNumber(r.margin), formatNumber(r.marginRate));
  blank();

  row("Frais généraux", "Montant (€)");
  row("Salaires", formatNumber(data.fraisGeneraux.salaires));
  row("Charges fixes", formatNumber(data.fraisGeneraux.chargesFixes));
  row("Énergie", formatNumber(data.fraisGeneraux.energie));
  row("Total mensuel", formatNumber(data.fraisGeneraux.total));
  blank();

  row("Salarié", "Mode", "Coût mensuel (€)", "Actif");
  for (const e of data.employees) row(e.nom, e.mode, formatNumber(e.coutMensuel), e.actif ? "Oui" : "Non");
  blank();

  row("Charge fixe", "Montant (€)", "Fréquence", "Actif");
  for (const c of data.fixedCosts) row(c.nom, formatNumber(c.montant), c.frequence, c.actif ? "Oui" : "Non");
  blank();

  row(`Prévisionnel — ${vocab.recipe}`, ...MONTH_HEADERS, "Total");
  for (const p of data.previsionnel) row(p.nom, ...p.parMois.map(formatNumber), formatNumber(p.total));
  blank();

  row("Rapport — Résumé du mois", "Ce mois", "Mois précédent");
  row("CA prévisionnel (€)", formatNumber(data.rapportResume.currentTotals.revenue), formatNumber(data.rapportResume.prevTotals.revenue));
  row("Coût total (€)", formatNumber(data.rapportResume.currentTotals.cost), formatNumber(data.rapportResume.prevTotals.cost));
  row("Marge (€)", formatNumber(data.rapportResume.currentTotals.margin), formatNumber(data.rapportResume.prevTotals.margin));
  blank();

  row("Prévisionnel vs réalisé (cumul)", "Prévisionnel", "Réalisé");
  for (const f of data.rapportPrevisionnelVsRealise) row(f.nom, formatNumber(f.previsionnel), formatNumber(f.realise));
  blank();

  row("Prévisionnel annuel — Mois", "CA du mois (€)", "Cumul (€)");
  for (const a of data.rapportAnnuel) row(a.mois, formatNumber(a.ca), formatNumber(a.cumul));
  blank();

  row(`Historique fournisseurs — ${vocab.ingredient}`, "Fournisseur", "Premier prix", "Dernier prix", "Variation (%)");
  for (const f of data.fournisseurs) {
    row(
      f.ingredientNom,
      f.supplierNom,
      `${formatNumber(f.firstPrice)}/${f.usageUnit}`,
      `${formatNumber(f.lastPrice)}/${f.usageUnit}`,
      formatNumber(f.changeRate)
    );
  }
  blank();

  row("Historique — Date", vocab.recipe, "Coût revient (€)", "Prix vente (€)", "Marge (€)", "Taux (%)");
  for (const h of data.historique) {
    row(
      new Date(h.date).toLocaleDateString("fr-FR"),
      h.recette,
      formatNumber(h.coutRevient),
      formatNumber(h.prixVente),
      formatNumber(h.marge),
      formatNumber(h.tauxMarge)
    );
  }

  return lines.join("\r\n");
}

export function ExportAllExcelButton({ data }: { data: FullExportData }) {
  const vocab = useVocabulary();
  const handleClick = () => {
    const csv = buildCsv(data, vocab);
    const bom = "﻿";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `export-complet-${data.month.toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" onClick={handleClick} className={`print:hidden ${secondaryButtonClass}`}>
      Exporter en Excel
    </button>
  );
}
