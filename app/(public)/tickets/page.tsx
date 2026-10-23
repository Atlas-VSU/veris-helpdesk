"use client";

import Link from "next/link";
import { Search, Ticket as TicketIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Ticket, TicketStatus } from "@/types/database";

const statuses: Array<{ value: "" | TicketStatus; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_for_client", label: "Waiting for you" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const statusLabels: Record<TicketStatus, string> = {
  new: "New",
  open: "Open",
  in_progress: "In progress",
  waiting_for_client: "Waiting for you",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
} as const;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<"" | TicketStatus>("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search.trim()) params.set("q", search.trim());

    async function loadTickets() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tickets?${params.toString()}`, {
          signal: controller.signal,
        });
        const body = (await response.json()) as { data?: Ticket[]; error?: string };

        if (!response.ok) {
          throw new Error(body.error ?? "Unable to load tickets.");
        }

        setTickets(body.data ?? []);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load tickets.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadTickets();
    return () => controller.abort();
  }, [search, status]);

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
            <NativeSelect
              onChange={(event) => setStatus(event.target.value as "" | TicketStatus)}
              value={status}
            >
              {statuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-8 text-center text-sm text-[var(--palette-gray-olive)]">
            Loading your tickets...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
            <p>{error}</p>
            <Link className="mt-3 inline-block font-semibold underline" href="/verify">
              Verify your email
            </Link>
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
              <article
                className="rounded-2xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-5 shadow-soft md:p-6"
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
                  <span>Created: {formatDate(ticket.created_at)}</span>
                  <span>Updated: {formatDate(ticket.updated_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
