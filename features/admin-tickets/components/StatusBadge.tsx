// features/admin-tickets/components/StatusBadge.tsx
// Renders a small, labeled status chip per DESIGN_TOKEN.md §4.
// Color mapping uses design token CSS custom properties via Tailwind utilities.

import { cn } from "@/lib/utils";
import type { TicketStatus } from "../types";

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string; dotClass: string }
> = {
  new: {
    label: "New",
    className: "bg-accent text-accent-foreground",
    dotClass: "bg-accent-foreground",
  },
  open: {
    label: "Open",
    className: "bg-accent text-foreground",
    dotClass: "bg-foreground",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-primary text-primary-foreground",
    dotClass: "bg-primary-foreground",
  },
  waiting_for_client: {
    label: "Awaiting Reply",
    className: "bg-warning text-warning-foreground",
    dotClass: "bg-warning-foreground",
  },
  resolved: {
    label: "Resolved",
    className: "bg-success text-success-foreground",
    dotClass: "bg-success-foreground",
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
};

type Props = { status: TicketStatus; className?: string };

export function StatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        config.className,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", config.dotClass)}
      />
      {config.label}
    </span>
  );
}
