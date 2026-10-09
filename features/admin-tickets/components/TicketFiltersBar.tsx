// features/admin-tickets/components/TicketFiltersBar.tsx
// The combined search + filter bar above the table.
// Controlled: parent owns all filter state via props.

"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TicketStatus, TicketPriority } from "../types";
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  ALL_VALUE,
  hasActiveFilters,
  type FilterState,
} from "../constants";

type Props = {
  filters: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onClear: () => void;
};

export function TicketFiltersBar({ filters, onChange, onClear }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-0 sm:max-w-xs">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          ref={searchRef}
          id="tickets-search"
          type="search"
          placeholder="Search ID or subject…"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          aria-label="Search tickets by ID or subject"
          className="pl-9 bg-card"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <Select
          value={filters.status || ALL_VALUE}
          onValueChange={(v: string | null) =>
            onChange({ status: !v || v === ALL_VALUE ? "" : (v as TicketStatus) })
          }
        >
          <SelectTrigger
            id="filter-status"
            aria-label="Filter by status"
            className={cn(
              "h-9 min-w-[130px] bg-card text-sm",
              filters.status && "border-primary text-primary"
            )}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select
          value={filters.priority || ALL_VALUE}
          onValueChange={(v: string | null) =>
            onChange({ priority: !v || v === ALL_VALUE ? "" : (v as TicketPriority) })
          }
        >
          <SelectTrigger
            id="filter-priority"
            aria-label="Filter by priority"
            className={cn(
              "h-9 min-w-[130px] bg-card text-sm",
              filters.priority && "border-primary text-primary"
            )}
          >
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All priorities</SelectItem>
            {PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear button */}
        {hasActiveFilters(filters) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            aria-label="Clear all filters"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
