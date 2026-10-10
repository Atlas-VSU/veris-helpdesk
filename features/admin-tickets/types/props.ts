// features/admin-tickets/types/props.ts
// Component prop interfaces for the admin tickets feature.

import type { Ticket, TicketStatus, TicketPriority } from "../types";
import type { FilterState } from "../constants";

export type StatusBadgeProps = {
  status: TicketStatus;
  className?: string;
};

export type PriorityBadgeProps = {
  priority: TicketPriority;
  className?: string;
};

export type BulkActionsBarProps = {
  count: number;
  onUpdateStatus: () => void;
  onAssign: () => void;
  onDelete: () => void;
};

export type TicketFiltersBarProps = {
  filters: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onClear: () => void;
};

export type TicketPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export type TicketRowProps = {
  ticket: Ticket;
  isSelected: boolean;
  onSelectChange: (checked: boolean) => void;
};

export type TicketTableProps = {
  tickets: Ticket[];
};
