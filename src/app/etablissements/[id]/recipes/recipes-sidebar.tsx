"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { SearchInput } from "@/components/search-input";

export type RecipeSummary = {
  id: string;
  nom: string;
  prix_vente: number;
};

export function RecipesSidebar({
  establishmentId,
  recipes,
}: {
  establishmentId: string;
  recipes: RecipeSummary[];
}) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const listHref = `/etablissements/${establishmentId}/recipes`;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter((recipe) => recipe.nom.toLowerCase().includes(query));
  }, [recipes, search]);

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-brand-line/70 bg-brand-panel">
      <div className="space-y-2 border-b border-brand-line/70 p-3">
        <Link
          href={listHref}
          className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === listHref
              ? "bg-brand-accent/10 text-brand-accent-dark"
              : "text-brand-ink hover:bg-brand-panel-soft"
          }`}
        >
          + Nouvelle recette / liste
        </Link>
        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher..." />
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {filtered.length ? (
          filtered.map((recipe) => {
            const href = `${listHref}/${recipe.id}`;
            const active = pathname === href;
            return (
              <Link
                key={recipe.id}
                href={href}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-brand-accent/10 font-medium text-brand-accent-dark"
                    : "text-brand-ink hover:bg-brand-panel-soft"
                }`}
              >
                <span className="truncate">{recipe.nom}</span>
                <span className="shrink-0 text-xs text-brand-muted">{money(recipe.prix_vente)}</span>
              </Link>
            );
          })
        ) : (
          <p className="px-3 py-2 text-sm text-brand-muted">Aucune recette.</p>
        )}
      </nav>
    </aside>
  );
}
