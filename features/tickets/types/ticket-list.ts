import type { TicketPriority, TicketStatus } from "@/types/database";

export type TicketStatusFilter = "" | TicketStatus;

export type TicketStatusOption = {
  value: TicketStatusFilter;
  label: string;
};

export type PublicTicket = {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  service: string;
  created_at: string;
  updated_at: string;
};
