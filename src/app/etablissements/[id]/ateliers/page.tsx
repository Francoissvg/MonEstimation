import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEstablishmentVocabulary } from "@/lib/establishment.server";
import { getWorkshopsWithCost } from "@/lib/recipe-costs.server";
import { breakEvenParticipants, sessionEconomics, sessionFixedCost } from "@/lib/workshops";
import { money } from "@/lib/format";
import { tableHeadClass, tableRowClass, tableWrapClass } from "@/lib/ui";
import { WorkshopForm } from "./workshop-form";
import { DeleteWorkshopButton } from "./delete-workshop-button";

export default async function AteliersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Sans la migration 009, la table n'existe pas encore : on le signale plutôt
  // que d'afficher une liste vide trompeuse.
  const { error: tableError } = await supabase.from("workshops").select("id").limit(1);
  const workshops = tableError ? [] : await getWorkshopsWithCost(supabase, id);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">Ateliers</h1>
      <p className="mt-1 text-sm text-brand-muted">
        Chaque participant reçoit un kit ({vocab.ingredientsLower}), et chaque séance a des frais fixes
        (animation, boissons...) quel que soit le nombre d&apos;inscrits. Le seuil de rentabilité indique
        combien de participants il faut au minimum pour ne pas perdre d&apos;argent.
      </p>

      {tableError ? (
        <p className="mt-6 rounded-xl border border-brand-warning/40 bg-brand-warning-bg p-4 text-sm text-brand-warning">
          Les ateliers ne sont pas encore activés dans la base de données : exécutez le fichier
          SQL <strong>009_ateliers.sql</strong> dans Supabase, puis rechargez la page.
        </p>
      ) : (
        <>
          <div className="mt-6">
            <WorkshopForm establishmentId={id} />
          </div>

          <div className={`mt-8 ${tableWrapClass}`}>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-4 py-3">Atelier</th>
                  <th className="px-4 py-3">Prix / participant</th>
                  <th className="px-4 py-3">Kit / participant</th>
                  <th className="px-4 py-3">Frais / séance</th>
                  <th className="px-4 py-3">Seuil de rentabilité</th>
                  <th className="px-4 py-3">Marge séance complète</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {workshops.length ? (
                  workshops.map((w) => {
                    const breakEven = breakEvenParticipants({
                      workshop: w,
                      kitCostPerParticipant: w.kitCost,
                      overheadPerParticipant: w.overheadPerParticipant,
                    });
                    const full = sessionEconomics({
                      workshop: w,
                      kitCostPerParticipant: w.kitCost,
                      overheadPerParticipant: w.overheadPerParticipant,
                      participants: w.max_participants,
                    });
                    const reachable = breakEven !== null && breakEven <= w.max_participants;
                    return (
                      <tr key={w.id} className={tableRowClass}>
                        <td className="px-4 py-3">
                          <Link
                            href={`/etablissements/${id}/ateliers/${w.id}`}
                            className="font-medium text-brand-ink hover:text-brand-accent hover:underline"
                          >
                            {w.nom}
                          </Link>
                          <Link
                            href={`/etablissements/${id}/ateliers/${w.id}`}
                            className="block text-xs text-brand-accent hover:underline"
                          >
                            Voir le détail →
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-brand-muted">{money(w.prix_participant)}</td>
                        <td className="px-4 py-3 text-brand-muted">{money(w.kitCost)}</td>
                        <td className="px-4 py-3 text-brand-muted">{money(sessionFixedCost(w))}</td>
                        <td className={`px-4 py-3 font-medium ${reachable ? "text-brand-success" : "text-brand-danger"}`}>
                          {breakEven === null ? "Jamais rentable" : `${breakEven} participant${breakEven > 1 ? "s" : ""}`}
                        </td>
                        <td className={`px-4 py-3 ${full.margin >= 0 ? "text-brand-success" : "text-brand-danger"}`}>
                          {money(full.margin)}{" "}
                          <span className="text-xs text-brand-muted">({w.max_participants} pers.)</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DeleteWorkshopButton id={w.id} establishmentId={id} nom={w.nom} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-brand-muted">
                      Aucun atelier pour l&apos;instant. Créez-en un ci-dessus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
