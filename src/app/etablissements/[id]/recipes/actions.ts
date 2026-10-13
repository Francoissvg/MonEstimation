"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { seedStarterData } from "@/lib/seed-starter-data.server";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";

export type FormState = { error: string | null };

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function saveRecipe(_prevState: FormState, formData: FormData): Promise<FormState> {
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const nom = String(formData.get("nom") ?? "").trim();
  const portions = parseNumber(formData.get("portions"));
  const prixVente = parseNumber(formData.get("prix_vente"));

  if (!nom) return { error: "Le nom est obligatoire." };
  if (portions === null || portions <= 0) {
    return { error: "Le nombre de portions doit être un nombre positif." };
  }
  if (prixVente === null || prixVente < 0) {
    return { error: "Le prix de vente doit être un nombre positif ou nul." };
  }

  const supabase = await createClient();
  const payload = {
    establishment_id: establishmentId,
    nom,
    portions,
    prix_vente: prixVente,
  };

  const query = id
    ? supabase.from("recipes").update(payload).eq("id", id).select("id").single()
    : supabase.from("recipes").insert(payload).select("id").single();
  const { error, data } = await query;

  if (error) {
    const vocab = await getEstablishmentVocabulary(establishmentId);
    if (error.code === "23505") return { error: `Une ${vocab.recipeLower} avec ce nom existe déjà.` };
    return { error: `Impossible d'enregistrer la ${vocab.recipeLower}.` };
  }

  revalidatePath(`/etablissements/${establishmentId}/recipes`);
  if (!id && data) {
    redirect(`/etablissements/${establishmentId}/recipes/${data.id}`);
  }
  return { error: null };
}

export async function deleteRecipe(id: string, establishmentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("recipes").delete().eq("id", id);
  revalidatePath(`/etablissements/${establishmentId}/recipes`);
}

export async function updateMonthlyForecast(
  recipeId: string,
  establishmentId: string,
  month: number,
  value: number
): Promise<{ error: string | null }> {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: "Mois invalide." };
  }
  if (!Number.isFinite(value) || value < 0) {
    return { error: "Le prévisionnel doit être un nombre positif ou nul." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recipe_monthly_forecasts")
    .upsert(
      { recipe_id: recipeId, month, quantity: value },
      { onConflict: "recipe_id,month" }
    );

  if (error) {
    return { error: "Impossible d'enregistrer le prévisionnel." };
  }

  revalidatePath(`/etablissements/${establishmentId}/projection`);
  revalidatePath(`/etablissements/${establishmentId}/recipes`);
  revalidatePath(`/etablissements/${establishmentId}/recipes/${recipeId}`);
  revalidatePath(`/etablissements/${establishmentId}`);
  return { error: null };
}

export async function updateMonthlyActual(
  recipeId: string,
  establishmentId: string,
  year: number,
  month: number,
  value: number
): Promise<{ error: string | null }> {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: "Année invalide." };
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return { error: "Mois invalide." };
  }
  if (!Number.isFinite(value) || value < 0) {
    return { error: "Le réalisé doit être un nombre positif ou nul." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recipe_monthly_actuals")
    .upsert(
      { recipe_id: recipeId, year, month, quantity: value },
      { onConflict: "recipe_id,year,month" }
    );

  if (error) {
    return { error: "Impossible d'enregistrer le réalisé." };
  }

  revalidatePath(`/etablissements/${establishmentId}/projection`);
  revalidatePath(`/etablissements/${establishmentId}/rapport`);
  return { error: null };
}

export async function addStarterExamples(
  establishmentId: string,
  type: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const result = await seedStarterData(supabase, establishmentId, type);
  revalidatePath(`/etablissements/${establishmentId}/recipes`);
  revalidatePath(`/etablissements/${establishmentId}/ingredients`);
  revalidatePath(`/etablissements/${establishmentId}`);
  return result;
}
