import Link from "next/link";
import { primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

// Bandeau partagé par la page d'accueil, la connexion et l'inscription :
// logo à gauche, connexion / création de compte à droite (sauf sur la page
// où le lien pointerait vers lui-même).
export function SiteHeader({
  showNav = false,
  hide,
}: {
  showNav?: boolean;
  hide?: "login" | "signup";
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-brand-line/70 bg-brand-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-accent to-brand-accent-dark text-xs font-bold text-white shadow-sm">
            EC
          </div>
          <p className="text-sm font-semibold tracking-tight text-brand-ink">EstimationCoût</p>
        </Link>
        {showNav ? (
          <nav className="hidden items-center gap-6 text-sm font-medium text-brand-muted sm:flex">
            <a href="#comment-ca-marche" className="hover:text-brand-ink">
              Comment ça marche
            </a>
            <a href="#fonctionnalites" className="hover:text-brand-ink">
              Fonctionnalités
            </a>
          </nav>
        ) : null}
        <div className="flex items-center gap-2">
          {hide !== "login" ? (
            <Link href="/login" className={secondaryButtonClass}>
              Se connecter
            </Link>
          ) : null}
          {hide !== "signup" ? (
            <Link href="/signup" className={`hidden sm:inline-flex ${primaryButtonClass}`}>
              Créer un compte
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
