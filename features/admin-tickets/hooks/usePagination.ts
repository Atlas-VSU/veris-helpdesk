// features/admin-tickets/hooks/usePagination.ts
// Hook for managing pagination state and logic.

"use client";

import { useCallback, useMemo, useState } from "react";

interface UsePaginationOptions {
    page?: number;
    pageSize?: number;
    total?: number;
    onPageChange?: (page: number) => void;
}

interface UsePaginationReturn {
    page: number;
    totalPages: number;
    handlePageChange: (page: number) => void;
    pageNumbers: (number | "…")[];
    from: number;
    to: number;
}

export function usePagination({
    page = 1,
    pageSize = 10,
    total = 0,
    onPageChange,
}: UsePaginationOptions = {}): UsePaginationReturn {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = Math.min((page - 1) * pageSize + 1, total);
    const to = Math.min(page * pageSize, total);

    /** Build the page number list with ellipsis: [1, …, 4, 5, 6, …, 12] */
    const pageNumbers = useMemo((): (number | "…")[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

        const pages: (number | "…")[] = [1];
        if (page > 3) pages.push("…");

        const start = Math.max(2, page - 1);
        const end = Math.min(totalPages - 1, page + 1);
        for (let i = start; i <= end; i++) pages.push(i);

        if (page < totalPages - 2) pages.push("…");
        pages.push(totalPages);
        return pages;
    }, [page, totalPages]);

    const handlePageChange = useCallback(
        (newPage: number) => {
            const clampedPage = Math.max(1, Math.min(newPage, totalPages));
            onPageChange?.(clampedPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        [totalPages, onPageChange]
    );

    return {
        page,
        totalPages,
        handlePageChange,
        pageNumbers,
        from,
        to,
    };
}