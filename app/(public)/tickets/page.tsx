"use client";

import Link from "next/link";
import { Search, Ticket as TicketIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { PublicTicket, TicketStatusFilter } from "@/features/tickets/types/ticket-list";
import {
  formatTicketDate,
  priorityLabels,
  statusLabels,
  ticketStatusOptions,
} from "@/features/tickets/utils/ticket-list";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<PublicTicket[]>([]);
  const [status, setStatus] = useState<TicketStatusFilter>("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string; requiresVerification: boolean } | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadTickets();
    }, 300);

    async function loadTickets() {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (search.trim()) params.set("q", search.trim());
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tickets?${params.toString()}`, {
          signal: controller.signal,
        });
        let body: { data?: PublicTicket[]; error?: string } = {};
        try {
          body = (await response.json()) as { data?: PublicTicket[]; error?: string };
        } catch {
          body = {};
        }

        if (!response.ok) {
          if (response.status === 401) {
            setError({
              message: "Your session expired. Please verify your email again.",
              requiresVerification: true,
            });
          } else {
            setError({
              message: "We couldn't load your tickets. Please try again.",
              requiresVerification: false,
            });
          }
          return;
        }

        setTickets(body.data ?? []);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError({
          message: "We couldn't load your tickets. Please check your connection and try again.",
          requiresVerification: false,
        });
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [retryNonce, search, status]);

  return (
    <main className="min-h-screen bg-[var(--palette-cream)] px-4 py-12 text-[var(--palette-charcoal-olive)] sm:px-6 md:px-12 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--palette-moss)]">
            Client portal
          </p>
          <h1 className="font-serif text-4xl font-semibold text-[var(--palette-dark-olive)] md:text-5xl">
            My Tickets
          </h1>
          <p className="mt-3 text-lg leading-7 text-[var(--palette-dark-olive)]">
            View and track your verified support requests.
          </p>
        </div>

        <div className="mb-8 grid gap-3 rounded-2xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-4 shadow-soft md:grid-cols-[1fr_13rem]">
          <label className="relative">
            <span className="sr-only">Search tickets</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--palette-gray-olive)]" />
            <Input
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by ticket number or subject"
              type="search"
              value={search}
            />
          </label>
          <label>
            <span className="sr-only">Filter tickets by status</span>
            <Select
              onChange={(event) => setStatus(event.target.value as TicketStatusFilter)}
              value={status}
            >
              {ticketStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-8 text-center text-sm text-[var(--palette-gray-olive)]">
            Loading your tickets...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
            <p>{error.message}</p>
            {error.requiresVerification ? (
              <Link className="mt-3 inline-block font-semibold underline" href="/verify">
                Verify your email
              </Link>
            ) : (
              <button
                className="mt-3 inline-block font-semibold underline"
                onClick={() => setRetryNonce((current) => current + 1)}
                type="button"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && tickets.length === 0 && (
          <div className="rounded-2xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-10 text-center shadow-soft">
            <TicketIcon aria-hidden="true" className="mx-auto size-10 text-[var(--palette-gray-olive)]" />
            <h2 className="mt-4 font-serif text-2xl font-semibold text-[var(--palette-dark-olive)]">
              No tickets found
            </h2>
            <p className="mt-2 text-sm text-[var(--palette-gray-olive)]">
              Try a different search or status filter, or submit a new request.
            </p>
            <Link
              className="mt-5 inline-block rounded-full bg-[var(--palette-dark-olive)] px-5 py-3 text-sm font-semibold text-[var(--palette-white)] hover:bg-[var(--palette-moss)]"
              href="/submit-ticket"
            >
              Submit a ticket
            </Link>
          </div>
        )}

        {!isLoading && !error && tickets.length > 0 && (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Link
                className="block rounded-2xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-5 shadow-soft transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--palette-moss)] md:p-6"
                href={`/tickets/${encodeURIComponent(ticket.ticket_number)}`}
                key={ticket.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--palette-gray-olive)]">
                      {ticket.ticket_number}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-[var(--palette-dark-olive)]">
                      {ticket.subject}
                    </h2>
                  </div>
                  <span className="w-fit rounded-full bg-[var(--palette-moss)]/10 px-3 py-1 text-xs font-semibold text-[var(--palette-moss)]">
                    {statusLabels[ticket.status]}
                  </span>
                </div>
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--palette-gray-olive)]">
                  {ticket.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--palette-stone)] pt-4 text-xs text-[var(--palette-gray-olive)]">
                  <span>Priority: {priorityLabels[ticket.priority]}</span>
                  <span>Service: {ticket.service}</span>
                  <span>Created: {formatTicketDate(ticket.created_at)}</span>
                  <span>Updated: {formatTicketDate(ticket.updated_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
