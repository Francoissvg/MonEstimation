"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { baseUnitFor } from "@/lib/units";
import { PURCHASE_UNITS } from "@/lib/constants";
import { ALL_INGREDIENT_CATEGORIES } from "@/lib/vocabulary";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";

export type FormState = { error: string | null };

function parsePositiveNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function saveIngredient(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const nom = String(formData.get("nom") ?? "").trim();
  const categorie = String(formData.get("categorie") ?? "");
  const purchaseUnit = String(formData.get("purchase_unit") ?? "");
  const purchaseQuantity = parsePositiveNumber(formData.get("purchase_quantity"));
  const purchasePrice = parsePositiveNumber(formData.get("purchase_price"));

  if (!nom) return { error: "Le nom est obligatoire." };
  if (!ALL_INGREDIENT_CATEGORIES.includes(categorie)) {
    return { error: "Catégorie invalide." };
  }
  if (!(PURCHASE_UNITS as readonly string[]).includes(purchaseUnit)) {
    return { error: "Unité d'achat invalide." };
  }
  if (purchaseQuantity === null) {
    return { error: "La quantité achetée doit être un nombre positif." };
  }
  if (purchasePrice === null) {
    return { error: "Le prix d'achat doit être un nombre positif." };
  }

  const supabase = await createClient();
  const payload = {
    establishment_id: establishmentId,
    nom,
    categorie,
    purchase_quantity: purchaseQuantity,
    purchase_unit: purchaseUnit,
    usage_unit: baseUnitFor(purchaseUnit),
    purchase_price: purchasePrice,
  };

  const { error } = id
    ? await supabase.from("ingredients").update(payload).eq("id", id)
    : await supabase.from("ingredients").insert(payload);

  if (error) {
    if (error.code === "23505") {
      return { error: (await getEstablishmentVocabulary(establishmentId)).ingredientExists };
    }
    return {
      error: `Impossible d'enregistrer ${(await getEstablishmentVocabulary(establishmentId)).theIngredient}.`,
    };
  }

  revalidatePath(`/etablissements/${establishmentId}/ingredients`);
  return { error: null };
}

export async function deleteIngredient(id: string, establishmentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ingredients").delete().eq("id", id);
  revalidatePath(`/etablissements/${establishmentId}/ingredients`);
}

export async function saveSupplier(_prevState: FormState, formData: FormData): Promise<FormState> {
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const nom = String(formData.get("nom") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();

  if (!nom) return { error: "Le nom est obligatoire." };

  const supabase = await createClient();
  const payload = { establishment_id: establishmentId, nom, contact };

  const { error } = id
    ? await supabase.from("suppliers").update(payload).eq("id", id)
    : await supabase.from("suppliers").insert(payload);

  if (error) {
    if (error.code === "23505") {
      return { error: "Un fournisseur avec ce nom existe déjà." };
    }
    return { error: "Impossible d'enregistrer le fournisseur." };
  }

  revalidatePath(`/etablissements/${establishmentId}/ingredients`);
  return { error: null };
}

export async function deleteSupplier(id: string, establishmentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("suppliers").delete().eq("id", id);
  revalidatePath(`/etablissements/${establishmentId}/ingredients`);
}

// Enregistre un nouvel achat dans l'historique et met à jour le prix courant
// de l'ingrédient (utilisé dans le calcul du coût des recettes).
export async function addIngredientPurchase(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const ingredientId = String(formData.get("ingredient_id") ?? "");
  const purchasedAt = String(formData.get("purchased_at") ?? "");
  const unit = String(formData.get("unit") ?? "");
  const quantity = parsePositiveNumber(formData.get("quantity"));
  const price = parsePositiveNumber(formData.get("price"));
  const note = String(formData.get("note") ?? "").trim();
  const supplierIdRaw = String(formData.get("supplier_id") ?? "").trim();
  const supplierId = supplierIdRaw ? supplierIdRaw : null;

  if (!ingredientId) return { error: (await getEstablishmentVocabulary(establishmentId)).ingredientNotFound };
  if (!purchasedAt) return { error: "La date est obligatoire." };
  if (!(PURCHASE_UNITS as readonly string[]).includes(unit)) {
    return { error: "Unité invalide." };
  }
  if (quantity === null) return { error: "La quantité doit être un nombre positif." };
  if (price === null) return { error: "Le prix doit être un nombre positif." };

  const supabase = await createClient();

  const { error: purchaseError } = await supabase.from("ingredient_purchases").insert({
    establishment_id: establishmentId,
    ingredient_id: ingredientId,
    purchased_at: purchasedAt,
    quantity,
    unit,
    price,
    note,
    supplier_id: supplierId,
  });

  if (purchaseError) {
    return { error: "Impossible d'enregistrer cet achat." };
  }

  const { error: updateError } = await supabase
    .from("ingredients")
    .update({
      purchase_quantity: quantity,
      purchase_unit: unit,
      usage_unit: baseUnitFor(unit),
      purchase_price: price,
    })
    .eq("id", ingredientId);

  if (updateError) {
    return { error: "Achat enregistré, mais le prix courant n'a pas pu être mis à jour." };
  }

  revalidatePath(`/etablissements/${establishmentId}/ingredients`);
  return { error: null };
}

export async function deleteIngredientPurchase(id: string, establishmentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ingredient_purchases").delete().eq("id", id);
  revalidatePath(`/etablissements/${establishmentId}/ingredients`);
}
