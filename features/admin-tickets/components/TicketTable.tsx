// features/admin-tickets/components/TicketTable.tsx
// The main table with a master checkbox for bulk selection.

"use client";

import { useCallback, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketRow } from "./TicketRow";
import { BulkActionsBar } from "./BulkActionsBar";
import type { Ticket } from "../types";

type Props = {
  tickets: Ticket[];
};

export function TicketTable({ tickets }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = tickets.length > 0 && selected.size === tickets.length;
  const someSelected = selected.size > 0 && selected.size < tickets.length;

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelected(checked ? new Set(tickets.map((t) => t.id)) : new Set());
    },
    [tickets]
  );

  const toggleOne = useCallback((id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelected(new Set());

  return (
    <div>
      {/* Bulk actions */}
      <BulkActionsBar
        count={selected.size}
        onAssign={clearSelection}
        onUpdateStatus={clearSelection}
        onDelete={clearSelection}
      />

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60 border-b border-border">
              {/* Master checkbox */}
              <TableHead className="w-12 pl-4 pr-2">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                  aria-label={allSelected ? "Deselect all" : "Select all"}
                  className="border-border data-checked:bg-primary data-checked:text-primary-foreground"
                />
              </TableHead>
              <TableHead className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ID
              </TableHead>
              <TableHead className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Client
              </TableHead>
              <TableHead className="w-1/3 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Subject
              </TableHead>
              <TableHead className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Priority
              </TableHead>
              <TableHead className="hidden px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground lg:table-cell">
                Service
              </TableHead>
              <TableHead className="pr-6 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Updated
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <td
                  colSpan={8}
                  className="py-16 text-center text-sm text-muted-foreground"
                >
                  No tickets found.
                </td>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  isSelected={selected.has(ticket.id)}
                  onSelectChange={(checked) => toggleOne(ticket.id, checked)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
