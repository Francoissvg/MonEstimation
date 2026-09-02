import type { SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  );
}

export function IngredientsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M8 9 10 4h4l2 5" />
      <path d="M3.5 9h17l-1.6 10a2 2 0 0 1-2 1.7H7.1a2 2 0 0 1-2-1.7L3.5 9Z" />
      <path d="M9 13v4M12 13v4M15 13v4" />
    </svg>
  );
}

export function RecipesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6.5c-1.9-1.3-4.3-1.6-6.5-1v13c2.2-.6 4.6-.3 6.5 1 1.9-1.3 4.3-1.6 6.5-1v-13c-2.2-.6-4.6-.3-6.5 1Z" />
      <path d="M12 6.5v13" />
    </svg>
  );
}

export function FraisIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 8.3c-.9-.6-1.9-.9-3-.9-2.3 0-4.2 1.6-4.2 4.6s1.9 4.6 4.2 4.6c1.1 0 2.1-.3 3-.9" />
      <path d="M7.3 10.8h5.8M7.3 13.2h5" />
    </svg>
  );
}

export function ForecastIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 17.5 9 12l4 4 7.5-7.5" />
      <path d="M15 8h5.5v5.5" />
    </svg>
  );
}

export function ReportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="12" width="3.2" height="8" rx="0.6" />
      <rect x="10.4" y="7" width="3.2" height="13" rx="0.6" />
      <rect x="16.8" y="3.5" width="3.2" height="16.5" rx="0.6" />
    </svg>
  );
}

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5l3.2 1.8" />
    </svg>
  );
}

export function ExportIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v10" />
      <path d="M7.5 10 12 14.5 16.5 10" />
      <path d="M4.5 15v3.2A1.8 1.8 0 0 0 6.3 20h11.4a1.8 1.8 0 0 0 1.8-1.8V15" />
    </svg>
  );
}

export function HelpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.3a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.2.9-1.2 1.8v.3" />
      <circle cx="12" cy="16.8" r="0.15" fill="currentColor" stroke="none" />
    </svg>
  );
}
