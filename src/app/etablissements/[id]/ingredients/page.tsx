import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { IngredientsManager } from "./ingredients-manager";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";
import type { PurchaseRow } from "./purchase-history";

export default async function IngredientsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();
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

  const vocab = await getEstablishmentVocabulary(id);

  const [{ data: ingredients }, { data: purchases }, { data: suppliers }] = await Promise.all([
    supabase
      .from("ingredients")
      .select("id, nom, categorie, purchase_quantity, purchase_unit, purchase_price")
      .eq("establishment_id", id)
      .order("nom"),
    supabase
      .from("ingredient_purchases")
      .select("id, ingredient_id, purchased_at, quantity, unit, price, note, supplier_id")
      .eq("establishment_id", id)
      .order("purchased_at", { ascending: false }),
    supabase.from("suppliers").select("id, nom, contact").eq("establishment_id", id).order("nom"),
  ]);

  const purchasesByIngredient: Record<string, PurchaseRow[]> = {};
  const purchaseCountBySupplier: Record<string, number> = {};
  for (const purchase of purchases ?? []) {
    const list = purchasesByIngredient[purchase.ingredient_id] ?? [];
    list.push(purchase);
    purchasesByIngredient[purchase.ingredient_id] = list;
    if (purchase.supplier_id) {
      purchaseCountBySupplier[purchase.supplier_id] = (purchaseCountBySupplier[purchase.supplier_id] ?? 0) + 1;
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">{vocab.ingredients}</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Le coût unitaire (par g, ml ou pièce) est calculé automatiquement à partir du prix et de
        la quantité {vocab.purchaseLot}. Utilisez « Historique » pour comparer vos achats dans le
        temps.
      </p>

      <div className="mt-6">
        <IngredientsManager
          establishmentId={id}
          ingredients={ingredients ?? []}
          purchasesByIngredient={purchasesByIngredient}
          suppliers={suppliers ?? []}
          purchaseCountBySupplier={purchaseCountBySupplier}
        />
      </div>
    </main>
  );
}
