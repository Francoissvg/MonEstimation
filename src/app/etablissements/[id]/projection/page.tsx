import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getPlanningData } from "@/lib/recipe-costs.server";
import { PlanningView } from "./planning-view";

export default async function ProjectionPage({
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

  const data = await getPlanningData(supabase, id);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">Prévisionnel</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Prévisionnel de vente mois par mois — les frais généraux (salariés saisonniers, charges
        fixes, énergie) s&apos;ajustent automatiquement selon le mois.
      </p>

      <div className="mt-6">
        <PlanningView
          establishmentId={id}
          recipes={data.recipes}
          workshops={data.workshops}
          employees={data.employees}
          fixedCosts={data.fixedCosts}
          utilitiesByMonth={data.utilitiesByMonth}
          margeCible={data.margeCible}
          actuals={data.actuals}
          actualsYear={data.actualsYear}
        />
      </div>
    </main>
  );
}
