import { MessageSquareText } from "lucide-react";
import type { ClientTicketMessage } from "@/features/client-ticket/schemas/ticket-detail";
import { formatTicketDate } from "@/features/client-ticket/utils/format";
import { cn } from "@/lib/utils";

type TicketMessageThreadProps = {
  messages: ClientTicketMessage[];
};

export function TicketMessageThread({ messages }: TicketMessageThreadProps) {
  return (
    <section
      aria-labelledby="ticket-conversation-heading"
      className="rounded-3xl border border-border bg-card p-5 text-card-foreground sm:p-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <MessageSquareText aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="ticket-conversation-heading" className="font-serif text-xl font-semibold">
              Conversation
            </h2>
            <p className="text-sm text-muted-foreground">Messages are shown oldest first.</p>
          </div>
        </div>
        <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
          Read-only
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-semibold">No messages yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Updates from the support team will appear here when they reply to your request.
          </p>
        </div>
      ) : (
        <ol className="mt-6 space-y-4" aria-label="Ticket messages">
          {messages.map((message, index) => {
            const isClient = message.sender_type === "client";

            return (
              <li key={`${message.created_at}-${index}`}>
                <article
                  className={cn(
                    "rounded-2xl border p-4 sm:p-5",
                    isClient ? "border-border bg-muted/60" : "border-[var(--palette-clay)] bg-accent/55",
                  )}
                >
                  <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm font-bold">{isClient ? "You" : "Support team"}</p>
                    <time
                      dateTime={message.created_at}
                      className="text-xs text-muted-foreground"
                    >
                      {formatTicketDate(message.created_at)}
                    </time>
                  </header>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 sm:text-base">
                    {message.body}
                  </p>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
