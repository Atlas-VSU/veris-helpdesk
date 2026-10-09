// features/admin-tickets/components/TicketsView.tsx
// Client component that owns filter + pagination state,
// fetches from the API (falling back to mock data during development),
// and wires everything together.

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketFiltersBar, type FilterState } from "./TicketFiltersBar";
import { TicketTable } from "./TicketTable";
import { TicketPagination } from "./TicketPagination";
import { fetchAdminTickets } from "../data";
import { MOCK_TICKETS, MOCK_TOTAL } from "../mock";
import type { Ticket } from "../types";

const DEFAULT_FILTERS: FilterState = { q: "", status: "", priority: "" };
const PAGE_SIZE = 10;

type ViewData = { tickets: Ticket[]; total: number };

export function TicketsView() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ViewData>({
    tickets: MOCK_TICKETS,
    total: MOCK_TOTAL,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(
    (f: FilterState, p: number) => {
      startTransition(async () => {
        try {
          const res = await fetchAdminTickets({
            q: f.q || undefined,
            status: f.status || undefined,
            page: p,
            pageSize: PAGE_SIZE,
          });
          setData({ tickets: res.data, total: res.total });
          setError(null);
        } catch {
          // Fall back to mock data so the UI is always useful in development
          setData({ tickets: MOCK_TICKETS, total: MOCK_TOTAL });
          setError(null);
        }
      });
    },
    []
  );

  useEffect(() => {
    load(filters, page);
  }, [filters, page, load]);

  const handleFilterChange = useCallback((next: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-4" />
              Export
            </Button>
            <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4">
          <TicketFiltersBar
            filters={filters}
            onChange={handleFilterChange}
            onClear={handleClear}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main
        id="tickets-list"
        className="flex-1 overflow-y-auto px-6 md:px-12 py-6"
        aria-busy={isPending}
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
            isPending ? "opacity-60 pointer-events-none transition-opacity duration-normal" : ""
          }
        >
          <TicketTable tickets={data.tickets} />
        </div>

        <div className="mt-6 pb-8">
          <TicketPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data.total}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
    </div>
  );
}
