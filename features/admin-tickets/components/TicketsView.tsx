// features/admin-tickets/components/TicketsView.tsx
// Client component that owns filter + pagination state,
// fetches from the API (falling back to mock data during development),
// and wires everything together.

"use client";

import { useEffect } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketFiltersBar } from "./TicketFiltersBar";
import { TicketTable } from "./TicketTable";
import { TicketPagination } from "./TicketPagination";
import { useTickets } from "../hooks/useTickets";
import { useFilters } from "../hooks/useFilters";
import { usePagination } from "../hooks/usePagination";
import { DEFAULT_FILTERS, PAGE_SIZE } from "../constants";
import type { FilterState } from "../constants";

export function TicketsView() {
  const { tickets, total, isLoading, error, fetchTickets } = useTickets({
    pageSize: PAGE_SIZE,
  });
  const { filters, handleFilterChange, handleClear: handleClearFilters } = useFilters(DEFAULT_FILTERS);
  const { page, handlePageChange, resetPage } = usePagination({
    initialPage: 1,
    pageSize: PAGE_SIZE,
    total,
  });

  const onFilterChange = (next: Partial<FilterState>) => {
    handleFilterChange(next);
    resetPage();
  };

  const onClearFilters = () => {
    handleClearFilters();
    resetPage();
  };

  // Fetch tickets when filters or page changes
  useEffect(() => {
    fetchTickets({
      q: filters.q || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      page,
      pageSize: PAGE_SIZE,
    });
  }, [filters, page, fetchTickets]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <header className="sticky top-0 z-sticky flex-none border-b border-border bg-background/80 backdrop-blur-md px-6 md:px-12 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground leading-tight">
              Tickets Management
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              View, filter, and manage all support requests.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-4" />
              Export
            </Button>
            <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" />
              New Ticket
            </Button> */}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4">
          <TicketFiltersBar
            filters={filters}
            onChange={onFilterChange}
            onClear={onClearFilters}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main
        id="tickets-list"
        className="flex-1 overflow-y-auto px-6 md:px-12 py-6"
        aria-busy={isLoading}
        aria-label="Ticket list"
      >
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <div
          className={
            isLoading ? "opacity-60 pointer-events-none transition-opacity duration-normal" : ""
          }
        >
          <TicketTable tickets={tickets} />
        </div>

        <div className="mt-6 pb-8">
          <TicketPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
    </div>
  );
}
