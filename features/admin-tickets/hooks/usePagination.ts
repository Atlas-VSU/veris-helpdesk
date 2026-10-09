// features/admin-tickets/hooks/usePagination.ts
// Hook for managing pagination state and logic.

"use client";

import { useCallback, useMemo, useState } from "react";

interface UsePaginationOptions {
    initialPage?: number;
    page?: number;
    pageSize?: number;
    total?: number;
    onPageChange?: (page: number) => void;
}

interface UsePaginationReturn {
    page: number;
    totalPages: number;
    handlePageChange: (page: number) => void;
    resetPage: () => void;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    pageNumbers: (number | "…")[];
    from: number;
    to: number;
}

export function usePagination({
    initialPage = 1,
    page: controlledPage,
    pageSize = 10,
    total = 0,
    onPageChange,
}: UsePaginationOptions = {}): UsePaginationReturn {
    const [internalPage, setInternalPage] = useState(initialPage);
    const page = controlledPage ?? internalPage;

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const from = total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total);
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
            setInternalPage(clampedPage);
            onPageChange?.(clampedPage);
            if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        },
        [totalPages, onPageChange]
    );

    const resetPage = useCallback(() => {
        setInternalPage(1);
    }, []);

    return {
        page,
        totalPages,
        handlePageChange,
        resetPage,
        setPage: setInternalPage,
        pageNumbers,
        from,
        to,
    };
}