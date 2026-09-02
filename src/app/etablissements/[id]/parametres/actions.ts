"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error: string | null };

function parseNonNegativeNumber(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseActiveMonths(formData: FormData): number[] | null {
  const values = formData
    .getAll("active_months")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
  return values.length ? values : null;
}

function revalidateAll(establishmentId: string) {
  revalidatePath(`/etablissements/${establishmentId}/parametres`);
  revalidatePath(`/etablissements/${establishmentId}/recipes`);
  revalidatePath(`/etablissements/${establishmentId}/projection`);
  revalidatePath(`/etablissements/${establishmentId}`);
}

export async function saveTargetMargin(_prevState: FormState, formData: FormData): Promise<FormState> {
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const margeCible = parseNonNegativeNumber(formData.get("marge_cible"));

  if (margeCible === null || margeCible >= 100) {
    return { error: "La marge cible doit être comprise entre 0 et 99." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("establishment_settings").upsert(
    {
      establishment_id: establishmentId,
      marge_cible: margeCible,
    },
    { onConflict: "establishment_id" }
  );

  if (error) {
    return { error: "Impossible d'enregistrer le réglage." };
  }

  revalidateAll(establishmentId);
  return { error: null };
}

// --- Salariés ---

export async function saveEmployee(_prevState: FormState, formData: FormData): Promise<FormState> {
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const nom = String(formData.get("nom") ?? "").trim();
  const salaryMode = String(formData.get("salary_mode") ?? "horaire");
  const hourlyRate = parseNonNegativeNumber(formData.get("hourly_rate")) ?? 0;
  const hoursPerWeek = parseNonNegativeNumber(formData.get("hours_per_week")) ?? 0;
  const monthlySalary = parseNonNegativeNumber(formData.get("monthly_salary")) ?? 0;
  const note = String(formData.get("note") ?? "").trim();
  const activeMonths = parseActiveMonths(formData);

  if (!nom) return { error: "Le nom est obligatoire." };
  if (!["horaire", "mensuel"].includes(salaryMode)) return { error: "Mode de salaire invalide." };

  const supabase = await createClient();
  const payload = {
    establishment_id: establishmentId,
    nom,
    salary_mode: salaryMode,
    hourly_rate: hourlyRate,
    hours_per_week: hoursPerWeek,
    monthly_salary: monthlySalary,
    note,
    active_months: activeMonths,
  };
  const { error } = id
    ? await supabase.from("employees").update(payload).eq("id", id)
    : await supabase.from("employees").insert(payload);

  if (error) {
    if (error.code === "23505") return { error: "Un salarié avec ce nom existe déjà." };
    return { error: "Impossible d'enregistrer le salarié." };
  }

  revalidateAll(establishmentId);
  return { error: null };
}

export async function deleteEmployee(id: string, establishmentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("employees").delete().eq("id", id);
  revalidateAll(establishmentId);
}

export async function toggleEmployeeActive(
  id: string,
  establishmentId: string,
  active: boolean
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("employees").update({ active }).eq("id", id);
  revalidateAll(establishmentId);
}

// --- Charges fixes ---

export async function saveFixedCost(_prevState: FormState, formData: FormData): Promise<FormState> {
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const id = formData.get("id") ? String(formData.get("id")) : null;
  const nom = String(formData.get("nom") ?? "").trim();
  const montant = parseNonNegativeNumber(formData.get("montant"));
  const frequence = String(formData.get("frequence") ?? "mensuel");
  const categorie = String(formData.get("categorie") ?? "Général").trim() || "Général";
  const note = String(formData.get("note") ?? "").trim();
  const activeMonths = parseActiveMonths(formData);

  if (!nom) return { error: "Le nom est obligatoire." };
  if (montant === null) return { error: "Le montant doit être un nombre positif ou nul." };
  if (!["mensuel", "annuel"].includes(frequence)) return { error: "Fréquence invalide." };

  const supabase = await createClient();
  const payload = {
    establishment_id: establishmentId,
    nom,
    montant,
    frequence,
    categorie,
    note,
    active_months: activeMonths,
  };
  const { error } = id
    ? await supabase.from("fixed_costs").update(payload).eq("id", id)
    : await supabase.from("fixed_costs").insert(payload);

  if (error) {
    if (error.code === "23505") return { error: "Une charge avec ce nom existe déjà." };
    return { error: "Impossible d'enregistrer la charge fixe." };
  }

  revalidateAll(establishmentId);
  return { error: null };
}

export async function deleteFixedCost(id: string, establishmentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("fixed_costs").delete().eq("id", id);
  revalidateAll(establishmentId);
}

export async function toggleFixedCostActive(
  id: string,
  establishmentId: string,
  active: boolean
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("fixed_costs").update({ active }).eq("id", id);
  revalidateAll(establishmentId);
}

// --- Énergie / eau ---

export async function saveUtility(_prevState: FormState, formData: FormData): Promise<FormState> {
  const establishmentId = String(formData.get("establishment_id") ?? "");
  const type = String(formData.get("type") ?? "electricite");
  const recordedAt = String(formData.get("recorded_at") ?? "");
  const consumption = parseNonNegativeNumber(formData.get("consumption"));
  const unite = String(formData.get("unite") ?? "kWh").trim() || "kWh";
  const prix = parseNonNegativeNumber(formData.get("prix"));
  const note = String(formData.get("note") ?? "").trim();

  if (!["electricite", "gaz", "eau"].includes(type)) return { error: "Type invalide." };
  if (!recordedAt) return { error: "La date est obligatoire." };
  if (consumption === null) return { error: "La consommation doit être un nombre positif ou nul." };
  if (prix === null) return { error: "Le prix doit être un nombre positif ou nul." };

  const supabase = await createClient();
  const { error } = await supabase.from("utilities").insert({
    establishment_id: establishmentId,
    type,
    recorded_at: recordedAt,
    consumption,
    unite,
    prix,
    note,
  });

  if (error) {
    return { error: "Impossible d'enregistrer cette consommation." };
  }

  revalidateAll(establishmentId);
  return { error: null };
}

export async function deleteUtility(id: string, establishmentId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("utilities").delete().eq("id", id);
  revalidateAll(establishmentId);
}
