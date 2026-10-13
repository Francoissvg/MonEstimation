"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactElement, type SVGProps } from "react";
import { logout } from "../../login/actions";
import { useVocabulary } from "@/components/vocabulary-provider";
import { HelpLink } from "@/components/help-link";
import {
  DashboardIcon,
  ExportIcon,
  ForecastIcon,
  FraisIcon,
  HistoryIcon,
  IngredientsIcon,
  RecipesIcon,
  ReportIcon,
  WorkshopIcon,
} from "@/components/nav-icons";

const ICONS: Record<string, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  dashboard: DashboardIcon,
  ingredients: IngredientsIcon,
  recipes: RecipesIcon,
  ateliers: WorkshopIcon,
  parametres: FraisIcon,
  projection: ForecastIcon,
  rapport: ReportIcon,
  historique: HistoryIcon,
  export: ExportIcon,
};

function Logo() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-accent-dark text-xs font-bold text-white shadow-sm">
      EC
    </div>
  );
}

// Contenu du menu, partagé entre la colonne fixe (ordinateur) et le tiroir (téléphone).
function SidebarContent({
  establishmentId,
  nom,
  type,
  email,
  showHelp,
  onNavigate,
}: {
  establishmentId: string;
  nom: string;
  type: string;
  email: string;
  showHelp: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const vocab = useVocabulary();
  const base = `/etablissements/${establishmentId}`;

  const items = [
    { key: "dashboard", href: base, label: "Tableau de bord" },
    { key: "ingredients", href: `${base}/ingredients`, label: vocab.ingredients },
    { key: "recipes", href: `${base}/recipes`, label: vocab.recipes },
    ...(vocab.hasWorkshops ? [{ key: "ateliers", href: `${base}/ateliers`, label: "Ateliers" }] : []),
    { key: "parametres", href: `${base}/parametres`, label: "Frais généraux" },
    { key: "projection", href: `${base}/projection`, label: "Prévisionnel" },
    { key: "rapport", href: `${base}/rapport`, label: "Rapport" },
    { key: "historique", href: `${base}/historique`, label: "Historique" },
    { key: "export", href: `${base}/export`, label: "Export complet" },
  ];

  const isActive = (href: string) => (href === base ? pathname === base : pathname?.startsWith(href));

  return (
    <>
      <div className="flex items-center gap-2.5 px-6 pb-2 pt-6">
        <Logo />
        <p className="text-sm font-semibold tracking-tight text-brand-ink">EstimationCoût</p>
      </div>

      <div className="px-6 pb-5 pt-3">
        <Link
          href="/etablissements"
          onClick={onNavigate}
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
              onClick={onNavigate}
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
        {showHelp ? <HelpLink className="mb-3" /> : null}
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
    </>
  );
}

export function Sidebar(props: { establishmentId: string; nom: string; type: string; email: string }) {
  const [open, setOpen] = useState(false);

  // Empêche la page de défiler derrière le tiroir ouvert.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {/* Ordinateur : colonne fixe à gauche. */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-brand-line/70 bg-sidebar-bg print:hidden lg:flex">
        <SidebarContent {...props} showHelp={false} />
      </aside>

      {/* Téléphone / tablette : barre en haut + menu en tiroir. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-brand-line/70 bg-sidebar-bg/95 px-4 py-2.5 backdrop-blur print:hidden lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-ml-1 rounded-lg p-2 text-brand-ink transition-colors hover:bg-sidebar-hover"
          aria-label="Ouvrir le menu"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Logo />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-ink">{props.nom}</p>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-brand-ink/40"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-sidebar-bg shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-brand-muted transition-colors hover:bg-sidebar-hover hover:text-brand-ink"
              aria-label="Fermer le menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
            <SidebarContent {...props} showHelp onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
