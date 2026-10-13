import { createClient } from "@/lib/supabase/server";
import { RecipesSidebar } from "./recipes-sidebar";

export default async function RecipesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, nom, prix_vente")
    .eq("establishment_id", id)
    .order("nom");

  return (
    <div className="flex flex-1">
      <RecipesSidebar establishmentId={id} recipes={recipes ?? []} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
