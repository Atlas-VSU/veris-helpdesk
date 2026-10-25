import type {
  ClientTicketPriority,
  ClientTicketStatus,
} from "@/features/client-ticket/schemas/ticket-detail";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  ClientTicketStatus,
  { label: string; className: string; dotClassName: string }
> = {
  new: {
    label: "New",
    className: "bg-accent text-accent-foreground",
    dotClassName: "bg-accent-foreground",
  },
  open: {
    label: "Open",
    className: "bg-status-open text-status-open-foreground",
    dotClassName: "bg-status-open-foreground",
  },
  in_progress: {
    label: "In progress",
    className: "bg-status-in-progress text-status-in-progress-foreground",
    dotClassName: "bg-status-in-progress-foreground",
  },
  waiting_for_client: {
    label: "Awaiting reply",
    className: "bg-status-awaiting-reply text-status-awaiting-reply-foreground",
    dotClassName: "bg-status-awaiting-reply-foreground",
  },
  resolved: {
    label: "Resolved",
    className: "bg-status-resolved text-status-resolved-foreground",
    dotClassName: "bg-status-resolved-foreground",
  },
  closed: {
    label: "Closed",
    className: "bg-status-closed text-status-closed-foreground",
    dotClassName: "bg-status-closed-foreground",
  },
};

const priorityConfig: Record<
  ClientTicketPriority,
  { label: string; className: string }
> = {
  low: {
    label: "Low priority",
    className: "bg-priority-low text-priority-low-foreground",
  },
  medium: {
    label: "Medium priority",
    className: "bg-priority-normal text-priority-normal-foreground",
  },
  high: {
    label: "High priority",
    className: "bg-priority-high text-priority-high-foreground",
  },
  urgent: {
    label: "Urgent priority",
    className: "bg-priority-urgent text-priority-urgent-foreground",
  },
};

type TicketStatusBadgeProps = {
  status: ClientTicketStatus;
};

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      aria-label={`Status: ${config.label}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
        config.className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", config.dotClassName)} />
      {config.label}
    </span>
  );
}

type TicketPriorityBadgeProps = {
  priority: ClientTicketPriority;
};

export function TicketPriorityBadge({ priority }: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      aria-label={`Priority: ${config.label}`}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
