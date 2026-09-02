import { HelpIcon } from "./nav-icons";

// Adresse de contact temporaire — à remplacer par l'adresse définitive du support.
const SUPPORT_EMAIL = "francois.svg@hotmail.fr";

export function HelpLink({ className = "" }: { className?: string }) {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Besoin d'aide - EstimationCoût")}`}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-brand-line bg-white px-3 py-1.5 text-xs font-medium text-brand-ink transition-colors hover:border-brand-accent/40 hover:bg-brand-panel-soft ${className}`}
    >
      <HelpIcon className="h-4 w-4" />
      Besoin d&apos;aide ?
    </a>
  );
}
