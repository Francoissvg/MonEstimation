import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";
import { matterCost } from "@/lib/costing";
import { currentMonth, getMonthCostContext } from "@/lib/recipe-costs.server";
import {
  breakEvenParticipants,
  participantSteps,
  sessionEconomics,
  sessionFixedCost,
} from "@/lib/workshops";
import { StatTile } from "@/components/stat-tile";
import { money } from "@/lib/format";
import { MONTH_LABELS } from "@/lib/months";
import { ghostLinkClass, tableHeadClass, tableRowClass, tableWrapClass } from "@/lib/ui";
import { IngredientPicker } from "../../recipes/[recipeId]/ingredient-picker";
import {
  RecipeIngredientsManager,
  type RecipeIngredientRow,
} from "../../recipes/[recipeId]/recipe-ingredients-manager";
import { WorkshopForm } from "../workshop-form";
import { WorkshopForecastEditor } from "./workshop-forecast-editor";

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string; workshopId: string }>;
}) {
  const { id, workshopId } = await params;
  const vocab = await getEstablishmentVocabulary(id);
  if (!vocab.hasWorkshops) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: workshop }, costContext, { data: allIngredients }, { data: kitRows }, { data: forecastRows }] =
    await Promise.all([
      supabase
        .from("workshops")
        .select(
          "id, nom, prix_participant, duree_heures, cout_horaire, frais_seance, min_participants, max_participants"
        )
        .eq("id", workshopId)
        .eq("establishment_id", id)
        .single(),
      getMonthCostContext(supabase, id),
      supabase
        .from("ingredients")
        .select("id, nom, categorie, purchase_quantity, purchase_unit, purchase_price")
        .eq("establishment_id", id)
        .order("nom"),
      supabase
        .from("workshop_items")
        .select(
          "id, quantite, unite, ingredient_id, ingredients(id, nom, categorie, purchase_quantity, purchase_unit, purchase_price)"
        )
        .eq("workshop_id", workshopId),
      supabase.from("workshop_monthly_forecasts").select("month, sessions, participants").eq("workshop_id", workshopId),
    ]);

  if (!workshop) {
    notFound();
  }

  const items: RecipeIngredientRow[] = (kitRows ?? []).map((row) => ({
    id: row.id,
    quantite: row.quantite,
    unite: row.unite,
    ingredient_id: row.ingredient_id,
    ingredient: Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients,
  }));
  const kitCost = matterCost(
    items.map((item) => ({ quantite: item.quantite, unite: item.unite, ingredient: item.ingredient }))
  );

  const initialForecasts = Array.from({ length: 12 }, () => ({ sessions: 0, participants: 0 }));
  for (const f of forecastRows ?? []) {
    initialForecasts[f.month - 1] = { sessions: f.sessions, participants: f.participants };
  }

  const overheadPerParticipant =
    costContext.workshops.find((w) => w.id === workshop.id)?.overheadPerParticipant ?? 0;
  const fixed = sessionFixedCost(workshop);
  const breakEven = breakEvenParticipants({ workshop, kitCostPerParticipant: kitCost, overheadPerParticipant });
  const steps = participantSteps(workshop);
  if (breakEven !== null && breakEven <= workshop.max_participants && !steps.includes(breakEven)) {
    steps.push(breakEven);
    steps.sort((a, b) => a - b);
  }
  const rows = steps.map((participants) =>
    sessionEconomics({ workshop, kitCostPerParticipant: kitCost, overheadPerParticipant, participants })
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <Link href={`/etablissements/${id}/ateliers`} className={ghostLinkClass}>
        ← Ateliers
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">{workshop.nom}</h1>

      <div className="mt-6">
        <WorkshopForm establishmentId={id} editing={workshop} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-brand-ink">Kit par participant</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Quantités fournies à <strong>chaque</strong> participant.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <IngredientPicker
          establishmentId={id}
          ownerId={workshop.id}
          availableIngredients={allIngredients ?? []}
          target="workshop"
        />
        <RecipeIngredientsManager establishmentId={id} ownerId={workshop.id} items={items} target="workshop" />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-brand-ink">Rentabilité d&apos;une séance</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Calculée pour {MONTH_LABELS[currentMonth() - 1]}, quote-part de frais généraux comprise (elle
        dépend du prévisionnel ci-dessous et de celui de vos {vocab.recipesLower}).
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Kit / participant" value={money(kitCost)} icon="🧺" />
        <StatTile label="Frais fixes / séance" value={money(fixed)} icon="🧾" />
        <StatTile label="Frais généraux / participant" value={money(overheadPerParticipant)} icon="🏠" />
        <StatTile
          label="Seuil de rentabilité"
          value={breakEven === null ? "Jamais rentable" : `${breakEven} participant${breakEven > 1 ? "s" : ""}`}
          tone={breakEven !== null && breakEven <= workshop.max_participants ? "success" : "danger"}
          icon="🎯"
        />
      </div>
      {breakEven === null ? (
        <p className="mt-2 text-sm text-brand-danger">
          Chaque participant coûte plus qu&apos;il ne rapporte : augmentez le prix ou réduisez le kit.
        </p>
      ) : breakEven > workshop.max_participants ? (
        <p className="mt-2 text-sm text-brand-danger">
          Il faudrait {breakEven} participants pour être rentable, au-delà du maximum de{" "}
          {workshop.max_participants}.
        </p>
      ) : null}

      <div className={`mt-4 ${tableWrapClass}`}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className={tableHeadClass}>
            <tr>
              <th className="px-4 py-3">Participants</th>
              <th className="px-4 py-3">CA</th>
              <th className="px-4 py-3">Kits</th>
              <th className="px-4 py-3">Frais de séance</th>
              <th className="px-4 py-3">Frais généraux</th>
              <th className="px-4 py-3">Coût / participant</th>
              <th className="px-4 py-3">Marge</th>
              <th className="px-4 py-3">Taux</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.participants}
                className={`${tableRowClass} ${row.participants === breakEven ? "bg-brand-success-bg/60" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-brand-ink">
                  {row.participants}
                  {row.participants === breakEven ? (
                    <span className="ml-2 text-xs font-normal text-brand-success">seuil</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-brand-muted">{money(row.revenue)}</td>
                <td className="px-4 py-3 text-brand-muted">{money(row.kitCost)}</td>
                <td className="px-4 py-3 text-brand-muted">{money(row.fixedCost)}</td>
                <td className="px-4 py-3 text-brand-muted">{money(row.overhead)}</td>
                <td className="px-4 py-3 text-brand-muted">{money(row.costPerParticipant)}</td>
                <td className={`px-4 py-3 font-medium ${row.margin >= 0 ? "text-brand-success" : "text-brand-danger"}`}>
                  {money(row.margin)}
                </td>
                <td className="px-4 py-3 text-brand-muted">
                  {row.revenue > 0 ? `${row.marginRate.toFixed(1)}%` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-brand-ink">Prévisionnel mensuel</h2>
      <p className="mt-1 text-sm text-brand-muted">
        Nombre de séances prévues chaque mois et nombre moyen de participants par séance — utilisé pour
        répartir les frais généraux et alimenter le tableau de bord, le{" "}
        <Link href={`/etablissements/${id}/projection`} className="underline">
          Prévisionnel
        </Link>{" "}
        et le Rapport.
      </p>
      <div className="mt-3">
        <WorkshopForecastEditor
          establishmentId={id}
          workshopId={workshop.id}
          prixParticipant={workshop.prix_participant}
          initialForecasts={initialForecasts}
        />
      </div>
    </main>
  );
}
