import type { Ticket, TicketStatus } from "@/types/database";

export type TicketStatusFilter = "" | TicketStatus;

export type TicketStatusOption = {
  value: TicketStatusFilter;
  label: string;
};

export type PublicTicket = Ticket;
