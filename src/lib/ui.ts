// Classes Tailwind partagées pour garder une apparence cohérente sur tout le site.

export const cardClass =
  "rounded-2xl border border-brand-line bg-brand-panel shadow-[0_1px_2px_rgba(23,32,42,0.04),0_8px_24px_-12px_rgba(23,32,42,0.08)]";

export const cardHoverClass =
  "transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-accent/40 hover:shadow-[0_1px_2px_rgba(23,32,42,0.04),0_16px_32px_-16px_rgba(37,109,133,0.25)]";

export const inputClass =
  "mt-1 w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink transition-shadow placeholder:text-brand-muted/60 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20";

export const labelClass = "block text-sm font-medium text-brand-ink";

export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-brand-accent to-brand-accent-dark px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-brand-line bg-white px-4 py-2 text-sm font-medium text-brand-ink transition-all hover:border-brand-accent/40 hover:bg-brand-panel-soft active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";

export const dangerLinkClass = "text-sm text-brand-danger hover:underline disabled:opacity-50";

export const ghostLinkClass = "text-sm text-brand-muted transition-colors hover:text-brand-accent";

export const tableWrapClass = `overflow-x-auto ${cardClass}`;

export const tableHeadClass =
  "border-b border-brand-line bg-brand-panel-soft/70 text-left text-xs font-semibold uppercase tracking-wide text-brand-muted";

export const tableRowClass =
  "border-b border-brand-line/60 last:border-0 transition-colors hover:bg-brand-panel-soft/60";
