// features/admin-tickets/components/StatusBadge.tsx
// Renders a small, labeled status chip per DESIGN_TOKEN.md §4.
// Color mapping uses design token CSS custom properties via Tailwind utilities.

import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type StatusBadgeProps } from "../constants/badges";

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        config.className,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full shrink-0", config.dotClass)}
      />
      {config.label}
    </span>
  );
}
