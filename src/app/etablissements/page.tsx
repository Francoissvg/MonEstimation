import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "../login/actions";
import { NewEstablishmentForm } from "./new-establishment-form";
import { DeleteButton } from "./delete-button";
import { cardClass, cardHoverClass, ghostLinkClass } from "@/lib/ui";
import { HelpLink } from "@/components/help-link";
import { getVocabulary } from "@/lib/vocabulary";

const TYPE_LABELS: Record<string, string> = {
  Boulangerie: "🥖 Boulangerie",
  Restaurant: "🍽️ Restaurant",
  Bar: "🍸 Bar",
  Fleuriste: "💐 Fleuriste",
  Autre: "🏪 Autre",
};

export default async function EtablissementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: establishments } = await supabase
    .from("establishments")
    .select("id, nom, type, created_at")
    .order("created_at", { ascending: false });

  const establishmentIds = (establishments ?? []).map((e) => e.id);
  const { data: recipeRows } = establishmentIds.length
    ? await supabase.from("recipes").select("establishment_id").in("establishment_id", establishmentIds)
    : { data: [] as { establishment_id: string }[] };
  const recipeCountById = new Map<string, number>();
  for (const r of recipeRows ?? []) {
    recipeCountById.set(r.establishment_id, (recipeCountById.get(r.establishment_id) ?? 0) + 1);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-accent-dark text-xs font-bold text-white shadow-sm">
              EC
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
              EstimationCoût
            </p>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-brand-ink">
            Vos établissements
          </h1>
          <p className="mt-1 truncate text-sm text-brand-muted">{user.email}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <HelpLink />
          <form action={logout}>
            <button type="submit" className={ghostLinkClass}>
              Se déconnecter
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <NewEstablishmentForm />
      </div>

      <ul className="mt-8 space-y-3">
        {establishments?.length ? (
          establishments.map((establishment) => (
            <li
              key={establishment.id}
              className={`flex items-center justify-between p-5 ${cardClass} ${cardHoverClass}`}
            >
              <Link href={`/etablissements/${establishment.id}`} className="flex-1">
                <p className="font-medium text-brand-ink">{establishment.nom}</p>
                <p className="text-sm text-brand-muted">
                  {TYPE_LABELS[establishment.type] ?? establishment.type} ·{" "}
                  {recipeCountById.get(establishment.id) ?? 0}{" "}
                  {(recipeCountById.get(establishment.id) ?? 0) > 1
                    ? getVocabulary(establishment.type).recipesLower
                    : getVocabulary(establishment.type).recipeLower}
                </p>
              </Link>
              <DeleteButton id={establishment.id} />
            </li>
          ))
        ) : (
          <li className="rounded-xl border border-dashed border-brand-line p-8 text-center text-sm text-brand-muted">
            Aucun établissement pour l&apos;instant. Créez-en un ci-dessus.
          </li>
        )}
      </ul>
    </main>
  );
}
