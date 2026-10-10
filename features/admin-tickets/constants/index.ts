// features/admin-tickets/constants/index.ts
// Shared constants for the admin tickets feature.

import type { TicketStatus, TicketPriority } from "../types";

/** Filter state shape for the ticket list */
export type FilterState = {
    q: string;
    status: TicketStatus | "";
    priority: TicketPriority | "";
};

/** Default filter state for the ticket list */
export const DEFAULT_FILTERS: FilterState = {
    q: "",
    status: "",
    priority: "",
};

/** Default page size for pagination */
export const PAGE_SIZE = 10;

/** Status filter options for the select dropdown */
export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
    { value: "new", label: "New" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "waiting_for_client", label: "Awaiting Reply" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
];

/** Priority filter options for the select dropdown */
export const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

/** Special value representing "all" in select dropdowns */
export const ALL_VALUE = "_all" as const;

/** Check if any filters are active */
export const hasActiveFilters = (filters: {
    q: string;
    status: TicketStatus | "";
    priority: TicketPriority | "";
}) => filters.q !== "" || filters.status !== "" || filters.priority !== "";