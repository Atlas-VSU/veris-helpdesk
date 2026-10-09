// features/admin-tickets/components/TicketRow.tsx
// A single row in the admin ticket table.
// Receives a Ticket and renders all columns per the prototype.

"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "./StatusBadge";
import { PriorityBadge } from "./PriorityBadge";
import { cn } from "@/lib/utils";
import { initials, formatRelativeTime, formatFullDate } from "../utils/format";
import type { Ticket } from "../types";

type Props = {
  ticket: Ticket;
  isSelected: boolean;
  onSelectChange: (checked: boolean) => void;
};

export function TicketRow({ ticket, isSelected, onSelectChange }: Props) {
  const timeAgo = formatRelativeTime(ticket.updated_at);
  const fullDate = formatFullDate(ticket.updated_at);
  const avatarLetters = initials(ticket.full_name);

  return (
    <tr
      className={cn(
        "group/row border-b border-border transition-colors duration-fast",
        isSelected
          ? "bg-accent/40"
          : "hover:bg-muted/50"
      )}
    >
      {/* Checkbox */}
      <td className="py-4 pl-4 pr-2 align-middle w-12">
        <Checkbox
          id={`select-${ticket.id}`}
          checked={isSelected}
          onCheckedChange={(v) => onSelectChange(Boolean(v))}
          aria-label={`Select ticket ${ticket.ticket_number}`}
          className="border-border data-checked:bg-primary data-checked:text-primary-foreground"
        />
      </td>

      {/* Ticket Number */}
      <td className="py-4 px-3 align-middle">
        <span className="font-mono text-xs text-muted-foreground">
          {ticket.ticket_number}
        </span>
      </td>

      {/* Client */}
      <td className="py-4 px-3 align-middle">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold"
          >
            {avatarLetters}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground leading-none truncate">
              {ticket.full_name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {ticket.email}
            </p>
          </div>
        </div>
      </td>

      {/* Subject */}
      <td className="py-4 px-3 align-middle w-1/3">
        <Link
          href={`/admin/tickets/${ticket.ticket_number}`}
          className="block group-hover/row:text-primary transition-colors duration-fast"
        >
          <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover/row:text-primary transition-colors">
            {ticket.subject}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {ticket.description}
          </p>
        </Link>
      </td>

      {/* Status */}
      <td className="py-4 px-3 align-middle">
        <StatusBadge status={ticket.status} />
      </td>

      {/* Priority */}
      <td className="py-4 px-3 align-middle">
        <PriorityBadge priority={ticket.priority} />
      </td>

      {/* Service */}
      <td className="py-4 px-3 align-middle hidden lg:table-cell">
        <span className="text-xs text-muted-foreground">{ticket.service}</span>
      </td>

      {/* Updated */}
      <td className="py-4 px-3 align-middle text-right pr-6">
        <time
          dateTime={ticket.updated_at}
          className="text-xs text-muted-foreground whitespace-nowrap"
          title={fullDate}
        >
          {timeAgo}
        </time>
      </td>
    </tr>
  );
}
