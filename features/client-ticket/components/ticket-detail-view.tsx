import Link from "next/link";
import { ArrowLeft, CalendarDays, FileText, Paperclip, UserRound } from "lucide-react";
import type { ClientTicketDetail } from "@/features/client-ticket/schemas/ticket-detail";
import {
  formatFileSize,
  formatTicketDate,
  formatUserType,
} from "@/features/client-ticket/utils/format";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/features/client-ticket/components/ticket-badges";
import { TicketMessageThread } from "@/features/client-ticket/components/ticket-message-thread";

type TicketDetailViewProps = {
  ticket: ClientTicketDetail;
};

export function TicketDetailView({ ticket }: TicketDetailViewProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <Link
        href="/tickets"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-bold text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to all tickets
      </Link>

      <article aria-labelledby="ticket-heading" className="mt-5 space-y-6">
        <header className="rounded-3xl border border-border bg-card p-5 text-card-foreground sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold tracking-wide text-primary">
                {ticket.ticket_number}
              </p>
              <h1
                id="ticket-heading"
                className="mt-2 break-words font-serif text-3xl font-semibold text-[var(--palette-dark-olive)] sm:text-4xl"
              >
                {ticket.subject}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4" />
              Submitted <time dateTime={ticket.created_at}>{formatTicketDate(ticket.created_at)}</time>
            </span>
            <span>Updated {formatTicketDate(ticket.updated_at)}</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)]">
          <section
            aria-labelledby="ticket-issue-heading"
            className="rounded-3xl border border-border bg-card p-5 text-card-foreground sm:p-7"
          >
            <div className="flex items-center gap-3 border-b border-border pb-5">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <FileText aria-hidden="true" className="size-5" />
              </span>
              <h2 id="ticket-issue-heading" className="font-serif text-xl font-semibold">
                Issue details
              </h2>
            </div>

            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Service
                </dt>
                <dd className="mt-1 break-words font-semibold">{ticket.service}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Client type
                </dt>
                <dd className="mt-1 font-semibold">{formatUserType(ticket.user_type)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Description
                </dt>
                <dd className="mt-2 whitespace-pre-wrap break-words leading-7">
                  {ticket.description}
                </dd>
              </div>
            </dl>
          </section>

          <aside className="space-y-6">
            <section
              aria-labelledby="ticket-requester-heading"
              className="rounded-3xl border border-border bg-card p-5 text-card-foreground sm:p-6"
            >
              <div className="flex items-center gap-3">
                <UserRound aria-hidden="true" className="size-5 text-primary" />
                <h2 id="ticket-requester-heading" className="font-serif text-lg font-semibold">
                  Requester
                </h2>
              </div>
              <p className="mt-4 break-words font-semibold">{ticket.full_name}</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{ticket.email}</p>
            </section>

            <section
              aria-labelledby="ticket-attachments-heading"
              className="rounded-3xl border border-border bg-card p-5 text-card-foreground sm:p-6"
            >
              <div className="flex items-center gap-3">
                <Paperclip aria-hidden="true" className="size-5 text-primary" />
                <h2 id="ticket-attachments-heading" className="font-serif text-lg font-semibold">
                  Attachments
                </h2>
              </div>

              {ticket.attachments.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  No attachments were included with this ticket.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {ticket.attachments.map((attachment, index) => (
                    <li
                      key={`${attachment.file_name}-${index}`}
                      className="min-w-0 rounded-xl border border-border bg-muted/50 p-3"
                    >
                      <p className="break-all text-sm font-semibold">{attachment.file_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {attachment.file_type} · {formatFileSize(attachment.file_size)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>

        <TicketMessageThread messages={ticket.messages} />
      </article>
    </main>
  );
}
