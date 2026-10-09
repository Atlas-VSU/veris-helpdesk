// features/admin-tickets/components/TicketPagination.tsx
// Page controls aligned with the API: page (1-based), pageSize, total.

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function TicketPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  /** Build the page number list with ellipsis: [1, …, 4, 5, 6, …, 12] */
  function pageNumbers(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
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

      {/* Controls */}
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="size-8"
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pageNumbers().map((p, i) =>
          p === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="flex size-8 items-center justify-center text-sm text-muted-foreground select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "size-8 text-sm",
                p === page && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {p}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="size-8"
        >
          <ChevronRight className="size-4" />
        </Button>
      </nav>
    </div>
  );
}
