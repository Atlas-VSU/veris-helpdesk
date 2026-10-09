// features/admin-tickets/constants/badges.ts
// Badge configuration constants for the admin tickets feature.

import type { TicketStatus, TicketPriority } from "../types";

/** Status badge configuration */
export const STATUS_CONFIG: Record<
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

/** Priority badge configuration */
export const PRIORITY_CONFIG: Record<
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

/** StatusBadge props type */
export type StatusBadgeProps = { status: TicketStatus; className?: string };

/** PriorityBadge props type */
export type PriorityBadgeProps = { priority: TicketPriority; className?: string };