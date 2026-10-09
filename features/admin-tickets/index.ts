// features/admin-tickets/index.ts
// Barrel export for the admin-tickets feature.

// Components
export { TicketsView } from "./components/TicketsView";
export { AdminSidebar } from "./components/AdminSidebar";
export { StatusBadge } from "./components/StatusBadge";
export { PriorityBadge } from "./components/PriorityBadge";
export { TicketFiltersBar } from "./components/TicketFiltersBar";
export { TicketTable } from "./components/TicketTable";
export { TicketRow } from "./components/TicketRow";
export { TicketPagination } from "./components/TicketPagination";
export { BulkActionsBar } from "./components/BulkActionsBar";

// Hooks
export { useTickets } from "./hooks/useTickets";
export { useFilters } from "./hooks/useFilters";
export { usePagination } from "./hooks/usePagination";

// Services
export { fetchAdminTickets } from "./services/api";
export { MOCK_TICKETS, MOCK_TOTAL } from "./services/mock";

// Constants
export {
    DEFAULT_FILTERS,
    PAGE_SIZE,
    STATUS_OPTIONS,
    PRIORITY_OPTIONS,
    ALL_VALUE,
    hasActiveFilters,
    type FilterState,
} from "./constants";

export {
    STATUS_CONFIG,
    PRIORITY_CONFIG,
    type StatusBadgeProps,
    type PriorityBadgeProps,
} from "./constants/badges";

// Utils
export { initials, formatRelativeTime, formatFullDate } from "./utils/format";

// Types
export type {
    AdminTicketsQuery,
    AdminTicketsResponse,
    Ticket,
    TicketStatus,
    TicketPriority,
} from "./types";
