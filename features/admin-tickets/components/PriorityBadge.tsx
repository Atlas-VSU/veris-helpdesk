// features/admin-tickets/components/PriorityBadge.tsx
// Renders a priority chip per DESIGN_TOKEN.md §4.
// Urgent uses destructive (coral) for maximum salience.

import { cn } from "@/lib/utils";
import { PRIORITY_CONFIG, type PriorityBadgeProps } from "../constants/badges";

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      aria-label={`Priority: ${config.label}`}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
