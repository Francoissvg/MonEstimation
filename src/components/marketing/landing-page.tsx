import Link from "next/link";
import { DashboardMockup } from "./screen-mockups";
import { HowItWorksSection } from "./how-it-works-section";
import { SiteHeader } from "./site-header";
import {
  ExportIcon,
  ForecastIcon,
  FraisIcon,
  HistoryIcon,
  IngredientsIcon,
  RecipesIcon,
  ReportIcon,
} from "@/components/nav-icons";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

const FEATURES = [
  { icon: IngredientsIcon, title: "Ingrédients & fournisseurs", body: "Prix d'achat, unités, historique par fournisseur." },
  { icon: RecipesIcon, title: "Recettes & marges", body: "Coût de revient et marge calculés automatiquement." },
  { icon: FraisIcon, title: "Frais généraux", body: "Salaires, charges, énergie — répartis au prorata du CA." },
  { icon: ForecastIcon, title: "Prévisionnel", body: "Quantités prévues par recette, mois par mois." },
  { icon: ReportIcon, title: "Rapports", body: "Marges, prévisionnel annuel, évolution des prix." },
  { icon: ExportIcon, title: "Export complet", body: "Tout l'établissement en PDF ou Excel." },
];

export function LandingPage() {
  return (
    <main className="flex-1 bg-brand-bg">
      <SiteHeader showNav />

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-accent/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">
              Pour restaurants, boulangeries, traiteurs & tous commerces alimentaires
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-brand-ink sm:text-4xl">
              Connaissez enfin le vrai coût de revient de vos recettes
            </h1>
            <p className="mt-4 text-base leading-relaxed text-brand-muted">
              Ingrédients, frais généraux, prévisionnel de vente : EstimationCoût calcule
              automatiquement votre coût de revient et votre marge, recette par recette, mois après
              mois — sans tableur à maintenir à la main.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className={primaryButtonClass}>
                Créer un compte gratuit
              </Link>
              <a href="#comment-ca-marche" className={secondaryButtonClass}>
                Voir comment ça marche
              </a>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <DashboardMockup />
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <section id="fonctionnalites" className="bg-brand-panel-soft/50 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">Fonctionnalités</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">
              Tout ce qu&apos;il faut pour piloter vos coûts
            </h2>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className={`p-5 ${cardClass}`}>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-panel-soft text-brand-accent-dark">
                  <f.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-brand-ink">{f.title}</p>
                <p className="mt-1 text-xs text-brand-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-gradient-to-br from-brand-accent-dark via-brand-accent to-[#0a89a6] px-8 py-12 text-center text-white sm:px-16">
          <HistoryIcon className="h-8 w-8 opacity-80" />
          <h2 className="text-2xl font-semibold tracking-tight">Prêt à sortir vos calculs de coûts d&apos;un tableur ?</h2>
          <p className="max-w-md text-sm text-white/85">
            Créez votre compte, ajoutez vos premiers ingrédients et voyez votre coût de revient
            se calculer en quelques minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-brand-accent-dark shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Créer mon compte gratuit
          </Link>
        </div>
      </section>

      <footer className="border-t border-brand-line/70 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs text-brand-muted sm:flex-row">
          <p>© {new Date().getFullYear()} EstimationCoût.</p>
          <Link href="/login" className="hover:text-brand-ink hover:underline">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </footer>
    </main>
  );
}
