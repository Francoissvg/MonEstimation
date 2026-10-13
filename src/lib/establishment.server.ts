import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getVocabulary, type Vocabulary } from "@/lib/vocabulary";

// Mis en cache pour la durée d'une requête : le layout, la page et les server
// actions peuvent tous le demander sans multiplier les allers-retours Supabase.
export const getEstablishment = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("establishments").select("id, nom, type").eq("id", id).single();
  return data;
});

export async function getEstablishmentVocabulary(id: string): Promise<Vocabulary> {
  const establishment = await getEstablishment(id);
  return getVocabulary(establishment?.type ?? "Autre");
}
