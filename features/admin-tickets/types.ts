// features/admin-tickets/types.ts
// Domain types for the admin tickets feature.
// Ticket and TicketStatus/TicketPriority align with openapi.yaml schemas.

import type { TicketStatus, TicketPriority, Ticket } from "@/types/database";

export type { Ticket, TicketStatus, TicketPriority };

/** Query params accepted by GET /api/admin/tickets */
export type AdminTicketsQuery = {
  status?: TicketStatus;
  priority?: TicketPriority;
  q?: string;
  page?: number;
  pageSize?: number;
};

/** Paginated response shape from GET /api/admin/tickets */
export type AdminTicketsResponse = {
  data: Ticket[];
  page: number;
  pageSize: number;
  total: number;
};
