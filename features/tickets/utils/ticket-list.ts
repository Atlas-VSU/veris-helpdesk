import type { TicketPriority, TicketStatus } from "@/types/database";
import type { TicketStatusFilter, TicketStatusOption } from "@/features/tickets/types/ticket-list";

export const ticketStatusOptions: TicketStatusOption[] = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_for_client", label: "Waiting for you" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const statusLabels: Record<TicketStatus, string> = {
  new: "New",
  open: "Open",
  in_progress: "In progress",
  waiting_for_client: "Waiting for you",
  resolved: "Resolved",
  closed: "Closed",
};

export const priorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const ticketStatuses = ticketStatusOptions
  .map(({ value }) => value)
  .filter((value): value is TicketStatus => value !== "");

export function isTicketStatus(value: string): value is TicketStatus {
  return ticketStatuses.includes(value as TicketStatus);
}

export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export function formatTicketDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function isTicketStatusFilter(value: string): value is TicketStatusFilter {
  return value === "" || isTicketStatus(value);
}
