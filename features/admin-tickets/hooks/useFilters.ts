// features/admin-tickets/hooks/useFilters.ts
// Hook for managing filter state in the ticket list.

"use client";

import { useCallback, useState } from "react";
import type { FilterState } from "../constants";

interface UseFiltersReturn {
    filters: FilterState;
    setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    handleFilterChange: (next: Partial<FilterState>) => void;
    handleClear: () => void;
}

export function useFilters(initialFilters: FilterState): UseFiltersReturn {
    const [filters, setFilters] = useState<FilterState>(initialFilters);

    const handleFilterChange = useCallback((next: Partial<FilterState>) => {
        setFilters((prev: FilterState) => ({ ...prev, ...next }));
    }, []);

    const handleClear = useCallback(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    return {
        filters,
        setFilters,
        handleFilterChange,
        handleClear,
    };
}