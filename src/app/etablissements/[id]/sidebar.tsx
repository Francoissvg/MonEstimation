"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, SVGProps } from "react";
import { logout } from "../../login/actions";
import {
  DashboardIcon,
  ExportIcon,
  ForecastIcon,
  FraisIcon,
  HistoryIcon,
  IngredientsIcon,
  RecipesIcon,
  ReportIcon,
} from "@/components/nav-icons";

const ICONS: Record<string, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  dashboard: DashboardIcon,
  ingredients: IngredientsIcon,
  recipes: RecipesIcon,
  parametres: FraisIcon,
  projection: ForecastIcon,
  rapport: ReportIcon,
  historique: HistoryIcon,
  export: ExportIcon,
};

export function Sidebar({
  establishmentId,
  nom,
  type,
  email,
}: {
  establishmentId: string;
  nom: string;
  type: string;
  email: string;
}) {
  const pathname = usePathname();
  const base = `/etablissements/${establishmentId}`;

  const items = [
    { key: "dashboard", href: base, label: "Tableau de bord" },
    { key: "ingredients", href: `${base}/ingredients`, label: "Ingrédients" },
    { key: "recipes", href: `${base}/recipes`, label: "Recettes" },
    { key: "parametres", href: `${base}/parametres`, label: "Frais généraux" },
    { key: "projection", href: `${base}/projection`, label: "Prévisionnel" },
    { key: "rapport", href: `${base}/rapport`, label: "Rapport" },
    { key: "historique", href: `${base}/historique`, label: "Historique" },
    { key: "export", href: `${base}/export`, label: "Export complet" },
  ];

  const isActive = (href: string) => (href === base ? pathname === base : pathname?.startsWith(href));

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-brand-line/70 bg-sidebar-bg print:hidden">
      <div className="flex items-center gap-2.5 px-6 pb-2 pt-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-accent-dark text-xs font-bold text-white shadow-sm">
          EC
        </div>
        <p className="text-sm font-semibold tracking-tight text-brand-ink">EstimationCoût</p>
      </div>

      <div className="px-6 pb-5 pt-3">
        <Link
          href="/etablissements"
          className="text-xs font-medium text-sidebar-muted transition-colors hover:text-brand-accent"
        >
          ← Vos établissements
        </Link>
        <p className="mt-3 truncate text-base font-semibold text-brand-ink">{nom}</p>
        <p className="text-xs text-sidebar-muted">{type}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = ICONS[item.key];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-active text-brand-accent-dark"
                  : "text-sidebar-text hover:bg-sidebar-hover"
              }`}
            >
              <span
                aria-hidden
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  active ? "bg-white shadow-sm" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-brand-line/70 px-6 py-4">
        <p className="truncate text-xs text-sidebar-muted">{email}</p>
        <form action={logout} className="mt-2">
          <button
            type="submit"
            className="text-xs font-medium text-sidebar-text transition-colors hover:text-brand-accent hover:underline"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
