"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { seedStarterData } from "@/lib/seed-starter-data.server";

export type EstablishmentType = "Boulangerie" | "Restaurant" | "Bar" | "Autre";

export type FormState = { error: string | null };

export async function createEstablishment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const nom = String(formData.get("nom") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const seedStarter = formData.get("seed_starter") === "on";

  if (!nom) {
    return { error: "Le nom est obligatoire." };
  }
  if (!["Boulangerie", "Restaurant", "Bar", "Autre"].includes(type)) {
    return { error: "Type d'établissement invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: establishment, error } = await supabase
    .from("establishments")
    .insert({ nom, type, user_id: user.id })
    .select("id")
    .single();

  if (error || !establishment) {
    return { error: "Impossible de créer l'établissement." };
  }

  if (seedStarter) {
    const { error: seedError } = await seedStarterData(supabase, establishment.id, type);
    if (seedError) {
      revalidatePath("/etablissements");
      return { error: seedError };
    }
  }

  revalidatePath("/etablissements");
  return { error: null };
}

export async function deleteEstablishment(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("establishments").delete().eq("id", id);
  revalidatePath("/etablissements");
}
