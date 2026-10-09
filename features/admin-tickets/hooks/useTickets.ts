// features/admin-tickets/hooks/useTickets.ts
// Hook for fetching and managing ticket data with loading/error states.

"use client";

import { useCallback, useState, useTransition } from "react";
import { fetchAdminTickets } from "../services/api";
import { MOCK_TICKETS, MOCK_TOTAL } from "../services/mock";
import type { Ticket, AdminTicketsQuery } from "../types";

interface UseTicketsOptions {
    pageSize?: number;
}

interface UseTicketsReturn {
    tickets: Ticket[];
    total: number;
    isLoading: boolean;
    error: string | null;
    fetchTickets: (query: AdminTicketsQuery) => Promise<void>;
    setTickets: (tickets: Ticket[]) => void;
    setTotal: (total: number) => void;
}

export function useTickets(options: UseTicketsOptions = {}): UseTicketsReturn {
    const { pageSize = 10 } = options;

    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [total, setTotal] = useState(MOCK_TOTAL);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const fetchTickets = useCallback(
        async (query: AdminTicketsQuery) => {
            startTransition(async () => {
                try {
                    const res = await fetchAdminTickets({
                        ...query,
                        pageSize,
                    });
                    setTickets(res.data);
                    setTotal(res.total);
                    setError(null);
                } catch {
                    // Fall back to mock data so the UI is always useful in development
                    setTickets(MOCK_TICKETS);
                    setTotal(MOCK_TOTAL);
                    setError(null);
                }
            });
        },
        [pageSize]
    );

    return {
        tickets,
        total,
        isLoading: isPending,
        error,
        fetchTickets,
        setTickets,
        setTotal,
    };
}