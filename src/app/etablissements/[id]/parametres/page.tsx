import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getMonthlyCostsSummary } from "@/lib/recipe-costs.server";
import { FraisManager } from "./frais-manager";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";

export default async function ParametresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vocab = await getEstablishmentVocabulary(id);
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [summary, { data: employees }, { data: fixedCosts }, { data: utilities }] = await Promise.all([
    getMonthlyCostsSummary(supabase, id),
    supabase
      .from("employees")
      .select("id, nom, salary_mode, hourly_rate, hours_per_week, monthly_salary, note, active, active_months")
      .eq("establishment_id", id)
      .order("nom"),
    supabase
      .from("fixed_costs")
      .select("id, nom, montant, frequence, categorie, note, active, active_months")
      .eq("establishment_id", id)
      .order("nom"),
    supabase
      .from("utilities")
      .select("id, type, recorded_at, consumption, unite, prix, note")
      .eq("establishment_id", id)
      .order("recorded_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">Frais généraux</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Salariés, charges fixes et énergie sont additionnés puis répartis sur vos{" "}
        {vocab.recipesLower} pour obtenir une quote-part de frais en plus du {vocab.matterCostLower}.
      </p>

      <div className="mt-6">
        <FraisManager
          establishmentId={id}
          employees={employees ?? []}
          fixedCosts={fixedCosts ?? []}
          utilities={utilities ?? []}
          summary={summary}
        />
      </div>
    </main>
  );
}
