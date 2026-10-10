// features/admin-tickets/components/TicketPagination.tsx
// Page controls aligned with the API: page (1-based), pageSize, total using shadcn pagination.

"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { usePagination } from "../hooks/usePagination";
import type { TicketPaginationProps } from "../types/props";

export function TicketPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: TicketPaginationProps) {
  const {
    totalPages,
    from,
    to,
    pageNumbers,
    handlePageChange,
  } = usePagination({ page, pageSize, total, onPageChange });

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 pt-4 sm:flex-row">
      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">{from}</span>
        {" – "}
        <span className="font-semibold text-foreground">{to}</span>
        {" of "}
        <span className="font-semibold text-foreground">{total}</span>
        {" results"}
      </p>

      {/* Shadcn Pagination Controls */}
      <Pagination className="w-auto mx-0">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) handlePageChange(page - 1);
              }}
              className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              aria-disabled={page <= 1}
            />
          </PaginationItem>

          {pageNumbers.map((p, i) =>
            p === "…" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(p);
                  }}
                  isActive={p === page}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page < totalPages) handlePageChange(page + 1);
              }}
              className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              aria-disabled={page >= totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
