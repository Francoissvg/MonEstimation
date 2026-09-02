const TONE_CLASSES: Record<string, { value: string; icon: string }> = {
  ink: { value: "text-brand-ink", icon: "bg-brand-panel-soft text-brand-ink" },
  accent: { value: "text-brand-accent-dark", icon: "bg-brand-accent/10 text-brand-accent-dark" },
  success: { value: "text-brand-success", icon: "bg-brand-success-bg text-brand-success" },
  warning: { value: "text-brand-warning", icon: "bg-brand-warning-bg text-brand-warning" },
  danger: { value: "text-brand-danger", icon: "bg-brand-danger-bg text-brand-danger" },
};

export function StatTile({
  label,
  value,
  tone = "ink",
  icon,
  delta,
  deltaTone = "ink",
}: {
  label: string;
  value: string;
  tone?: "ink" | "accent" | "success" | "warning" | "danger";
  icon?: string;
  delta?: string;
  deltaTone?: "ink" | "accent" | "success" | "warning" | "danger";
}) {
  const toneClasses = TONE_CLASSES[tone];
  return (
    <div className="rounded-2xl border border-brand-line bg-brand-panel p-4 shadow-[0_1px_2px_rgba(23,32,42,0.04),0_8px_24px_-12px_rgba(23,32,42,0.08)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
        {icon ? (
          <span
            aria-hidden
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${toneClasses.icon}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${toneClasses.value}`}>
        {value}
      </p>
      {delta ? (
        <p className={`mt-1 text-xs font-medium ${TONE_CLASSES[deltaTone].value}`}>{delta}</p>
      ) : null}
    </div>
  );
}
