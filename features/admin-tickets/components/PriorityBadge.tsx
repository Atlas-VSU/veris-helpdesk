// features/admin-tickets/components/PriorityBadge.tsx
// Renders a priority chip per DESIGN_TOKEN.md §4.
// Urgent uses destructive (coral) for maximum salience.

import { cn } from "@/lib/utils";
import type { TicketPriority } from "../types";

const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground",
  },
  medium: {
    label: "Medium",
    className: "bg-accent text-accent-foreground",
  },
  high: {
    label: "High",
    className: "bg-warning text-warning-foreground",
  },
  urgent: {
    label: "Urgent",
    className: "bg-destructive text-destructive-foreground",
  },
};

type Props = { priority: TicketPriority; className?: string };

export function PriorityBadge({ priority, className }: Props) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      aria-label={`Priority: ${config.label}`}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
