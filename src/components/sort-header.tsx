"use client";

export function SortHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 hover:text-brand-ink ${active ? "text-brand-ink" : ""}`}
    >
      {label}
      <span aria-hidden className={`text-[10px] ${active ? "opacity-100" : "opacity-0"}`}>
        {direction === "asc" ? "▲" : "▼"}
      </span>
    </button>
  );
}
