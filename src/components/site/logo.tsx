import { cn } from "@/lib/utils";

export function DhunLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-7", className)}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="14" fill="#171214" />
      <path
        d="M14 21.5l10.5 10.5L14 42.5"
        fill="none"
        stroke="#FF5C5C"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M37 41V25.5l11-3V36"
        fill="none"
        stroke="#4ADE80"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="33.3" cy="41.3" rx="4.4" ry="3.5" fill="#4ADE80" />
      <ellipse cx="44.3" cy="36.3" rx="4.4" ry="3.5" fill="#4ADE80" />
    </svg>
  );
}
