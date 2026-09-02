"use client";

import { secondaryButtonClass } from "@/lib/ui";

export function ExportPdfButton({ label = "Exporter en PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`print:hidden ${secondaryButtonClass}`}
    >
      {label}
    </button>
  );
}
