"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PURCHASE_UNITS } from "@/lib/constants";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";

export type FormState = { error: string | null };

function parseNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const normalized = String(value).trim().replace(",", ".");
  if (normalized === "") return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function revalidateWorkshops(establishmentId: string, workshopId?: string) {
  revalidatePath(`/etablissements/${establishmentId}/ateliers`);
  if (workshopId) revalidatePath(`/etablissements/${establishmentId}/ateliers/${workshopId}`);
  // Les ateliers pèsent sur la répartition des frais et les totaux : tout est recalculé.
  revalidatePath(`/etablissements/${establishmentId}`);
  revalidatePath(`/etablissements/${establishmentId}/projection`);
  revalidatePath(`/etablissements/${establishmentId}/rapport`);
  revalidatePath(`/etablissements/${establishmentId}/recipes`);
}

export async function saveWorkshop(_prevState: FormState, formData: FormData): Promise<FormState> {
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const nom = String(formData.get("nom") ?? "").trim();
  const prix = parseNumber(formData.get("prix_participant"));
  const duree = parseNumber(formData.get("duree_heures"));
  const coutHoraire = parseNumber(formData.get("cout_horaire"));
  const fraisSeance = parseNumber(formData.get("frais_seance"));
  const min = parseNumber(formData.get("min_participants"));
  const max = parseNumber(formData.get("max_participants"));

  if (!nom) return { error: "Le nom est obligatoire." };
  if (prix === null || prix < 0) return { error: "Le prix par participant doit être un nombre positif ou nul." };
  if (duree === null || duree < 0) return { error: "La durée doit être un nombre positif ou nul." };
  if (coutHoraire === null || coutHoraire < 0) return { error: "Le coût horaire doit être un nombre positif ou nul." };
  if (fraisSeance === null || fraisSeance < 0) return { error: "Les frais de séance doivent être un nombre positif ou nul." };
  if (min === null || !Number.isInteger(min) || min < 1) {
    return { error: "Le minimum de participants doit être un nombre entier, au moins 1." };
  }
  if (max === null || !Number.isInteger(max) || max < min) {
    return { error: "Le maximum de participants doit être un nombre entier, supérieur ou égal au minimum." };
  }

  const supabase = await createClient();
  const payload = {
    establishment_id: establishmentId,
    nom,
    prix_participant: prix,
    duree_heures: duree,
    cout_horaire: coutHoraire,
    frais_seance: fraisSeance,
    min_participants: min,
    max_participants: max,
  };

  const query = id
    ? supabase.from("workshops").update(payload).eq("id", id).select("id").single()
    : supabase.from("workshops").insert(payload).select("id").single();
  const { error, data } = await query;

  if (error) {
    if (error.code === "23505") return { error: "Un atelier avec ce nom existe déjà." };
    return { error: "Impossible d'enregistrer l'atelier." };
  }

  revalidateWorkshops(establishmentId, id ?? undefined);
  if (!id && data) {
    redirect(`/etablissements/${establishmentId}/ateliers/${data.id}`);
  }
  return { error: null };
}

export async function deleteWorkshop(id: string, establishmentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("workshops").delete().eq("id", id);
  revalidateWorkshops(establishmentId);
}

export async function saveWorkshopItem(_prevState: FormState, formData: FormData): Promise<FormState> {
  const workshopId = String(formData.get("workshop_id") ?? "");
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const ingredientId = String(formData.get("ingredient_id") ?? "");
  const unite = String(formData.get("unite") ?? "");
  const quantite = parseNumber(formData.get("quantite"));

  if (!ingredientId) return { error: (await getEstablishmentVocabulary(establishmentId)).chooseIngredient };
  if (!(PURCHASE_UNITS as readonly string[]).includes(unite)) return { error: "Unité invalide." };
  if (quantite === null || quantite <= 0) return { error: "La quantité doit être un nombre positif." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workshop_items")
    .upsert(
      { workshop_id: workshopId, ingredient_id: ingredientId, quantite, unite },
      { onConflict: "workshop_id,ingredient_id" }
    );

  if (error) {
    return {
      error: `Impossible d'ajouter ${(await getEstablishmentVocabulary(establishmentId)).thisIngredient} au kit.`,
    };
  }

  revalidateWorkshops(establishmentId, workshopId);
  return { error: null };
}

export async function deleteWorkshopItem(id: string, establishmentId: string, workshopId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("workshop_items").delete().eq("id", id);
  revalidateWorkshops(establishmentId, workshopId);
}

export async function updateWorkshopForecast(
  workshopId: string,
  establishmentId: string,
  month: number,
  sessions: number,
  participants: number
): Promise<{ error: string | null }> {
  if (!Number.isInteger(month) || month < 1 || month > 12) return { error: "Mois invalide." };
  if (!Number.isFinite(sessions) || sessions < 0 || !Number.isFinite(participants) || participants < 0) {
    return { error: "Le prévisionnel doit être un nombre positif ou nul." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("workshop_monthly_forecasts")
    .upsert(
      { workshop_id: workshopId, month, sessions, participants },
      { onConflict: "workshop_id,month" }
    );

  if (error) return { error: "Impossible d'enregistrer le prévisionnel." };

  revalidateWorkshops(establishmentId, workshopId);
  return { error: null };
}
