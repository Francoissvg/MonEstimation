import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HistoriqueTable } from "./historique-table";
import { SupplierPriceReport, type SupplierPriceRow } from "./supplier-price-report";
import { PurchaseVsSaleChart, type RecipeHistorySeries } from "./purchase-vs-sale-chart";
import { pricePerUsageUnit, baseUnitFor } from "@/lib/units";
import { cardClass } from "@/lib/ui";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";

export default async function HistoriquePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vocab = await getEstablishmentVocabulary(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: establishment } = await supabase
    .from("establishments")
    .select("id")
    .eq("id", id)
    .single();

  if (!establishment) {
    notFound();
  }

  const [{ data: history }, { data: purchases }, { data: ingredients }, { data: suppliers }] = await Promise.all([
    supabase
      .from("cost_history")
      .select(
        "id, recipe_nom, calculated_at, cout_matiere, quote_part_frais, cout_revient_unitaire, prix_vente, marge, taux_marge, prix_conseille"
      )
      .eq("establishment_id", id)
      .order("calculated_at", { ascending: false })
      .limit(200),
    supabase
      .from("ingredient_purchases")
      .select("ingredient_id, supplier_id, purchased_at, quantity, unit, price")
      .eq("establishment_id", id)
      .order("purchased_at", { ascending: true }),
    supabase.from("ingredients").select("id, nom").eq("establishment_id", id),
    supabase.from("suppliers").select("id, nom").eq("establishment_id", id),
  ]);

  // Rapport fournisseurs : variation du prix payé entre le premier et le dernier
  // achat, pour chaque paire ingrédient/fournisseur ayant au moins deux achats.
  const ingredientNomById = new Map((ingredients ?? []).map((i) => [i.id, i.nom]));
  const supplierNomById = new Map((suppliers ?? []).map((s) => [s.id, s.nom]));
  const bySupplierIngredient = new Map<
    string,
    { purchased_at: string; unitPrice: number; usageUnit: string }[]
  >();
  for (const p of purchases ?? []) {
    if (!p.supplier_id) continue;
    const key = `${p.ingredient_id}::${p.supplier_id}`;
    const list = bySupplierIngredient.get(key) ?? [];
    list.push({
      purchased_at: p.purchased_at,
      unitPrice: pricePerUsageUnit(p.quantity, p.unit, p.price),
      usageUnit: baseUnitFor(p.unit),
    });
    bySupplierIngredient.set(key, list);
  }
  const supplierPriceRows: SupplierPriceRow[] = Array.from(bySupplierIngredient.entries())
    .map(([key, points]) => {
      const [ingredientId, supplierId] = key.split("::");
      const sorted = [...points].sort(
        (a, b) => new Date(a.purchased_at).getTime() - new Date(b.purchased_at).getTime()
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const changeRate = first.unitPrice > 0 ? ((last.unitPrice - first.unitPrice) / first.unitPrice) * 100 : 0;
      return {
        ingredientId,
        supplierId,
        ingredientNom: ingredientNomById.get(ingredientId) ?? vocab.ingredient,
        supplierNom: supplierNomById.get(supplierId) ?? "Fournisseur",
        firstPrice: first.unitPrice,
        firstDate: first.purchased_at,
        lastPrice: last.unitPrice,
        lastDate: last.purchased_at,
        changeRate,
        usageUnit: first.usageUnit,
        count: sorted.length,
      };
    })
    .filter((r) => r.count >= 2)
    .sort((a, b) => Math.abs(b.changeRate) - Math.abs(a.changeRate));

  // Achat vs vente dans le temps : coût de revient et prix de vente enregistrés
  // à chaque snapshot d'historique, par recette.
  const historyByRecipe = new Map<string, { date: string; cout: number; prixVente: number }[]>();
  for (const h of history ?? []) {
    const list = historyByRecipe.get(h.recipe_nom) ?? [];
    list.push({ date: h.calculated_at, cout: h.cout_revient_unitaire, prixVente: h.prix_vente });
    historyByRecipe.set(h.recipe_nom, list);
  }
  const purchaseVsSaleSeries: RecipeHistorySeries[] = Array.from(historyByRecipe.entries()).map(
    ([recipeNom, points]) => ({
      recipeNom,
      points: [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    })
  );

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">Historique</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Suivez la hausse des prix par fournisseur et comparez ce que vous avez acheté à ce que vous
        avez vendu, dans le temps.
      </p>

      <div className="mt-6 space-y-8">
        <section className={`p-5 ${cardClass}`}>
          <h2 className="text-sm font-semibold text-brand-ink">Rapport fournisseurs</h2>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            Comparaison du prix payé pour {vocab.sameIngredient} auprès d&apos;un même fournisseur, entre
            le premier et le dernier achat.
          </p>
          <SupplierPriceReport rows={supplierPriceRows} />
        </section>

        <section className={`p-5 ${cardClass}`}>
          <h2 className="text-sm font-semibold text-brand-ink">Achat vs vente dans le temps</h2>
          <p className="mt-0.5 mb-4 text-xs text-brand-muted">
            Coût de revient par {vocab.part} comparé au prix de vente, à chaque calcul enregistré
            depuis une fiche {vocab.recipeLower}.
          </p>
          <PurchaseVsSaleChart series={purchaseVsSaleSeries} />
        </section>

        <details className={`group p-5 ${cardClass}`}>
          <summary className="cursor-pointer list-none text-sm font-semibold text-brand-ink">
            <span className="inline-flex items-center gap-2">
              <span className="transition-transform group-open:rotate-90">▸</span>
              Détail des calculs enregistrés{history?.length ? ` (${history.length})` : ""}
            </span>
          </summary>
          <div className="mt-4">
            <HistoriqueTable history={history ?? []} />
          </div>
        </details>
      </div>
    </main>
  );
}
