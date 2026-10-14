import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TicketSuccessStateProps } from "@/features/submit-ticket/types/types";

export function TicketSuccessState({ ticketNumber, email, subject, service, priority, description, onSubmitAnother }: TicketSuccessStateProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-6 text-center shadow-soft md:p-16">
      <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-[var(--palette-off-white)] text-[var(--palette-dark-olive)] shadow-soft">
        <CheckCircle2 aria-hidden="true" className="size-12" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--palette-dark-olive)] md:text-4xl">Your request has been recorded.</h1>
      <p className="mt-3 text-lg leading-7 text-[var(--palette-dark-olive)]">Your request is ready for review.</p>

      <dl className="mt-6 w-full min-w-0 rounded-xl bg-[var(--palette-off-white)] p-4 text-[var(--palette-dark-olive)]">
        <dt className="text-sm font-bold uppercase tracking-wider">Ticket number</dt>
        <dd className="mt-2 font-mono text-2xl font-bold [overflow-wrap:anywhere]">{ticketNumber}</dd>
      </dl>

      <div className="mt-10 w-full rounded-xl border border-[var(--palette-stone)]/50 bg-[var(--palette-cream)] p-6 text-left">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--palette-dark-olive)]">Issue Summary</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 text-base leading-6 text-[var(--palette-charcoal-olive)] sm:grid-cols-2">
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-sm font-bold text-[var(--palette-dark-olive)]">Email</dt>
            <dd className="mt-1 [overflow-wrap:anywhere]">{email}</dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-sm font-bold text-[var(--palette-dark-olive)]">Subject</dt>
            <dd className="mt-1 [overflow-wrap:anywhere]">{subject}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-sm font-bold text-[var(--palette-dark-olive)]">Service</dt>
            <dd className="mt-1 [overflow-wrap:anywhere]">{service}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-sm font-bold text-[var(--palette-dark-olive)]">Priority</dt>
            <dd className="mt-1 capitalize">{priority}</dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-sm font-bold text-[var(--palette-dark-olive)]">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{description}</dd>
          </div>
        </dl>
        <div className="mt-6 flex items-center gap-3 border-t border-[var(--palette-stone)]/50 pt-4 text-sm font-bold text-[var(--palette-moss)]">
          <Clock3 aria-hidden="true" className="size-5" />
          <span>Expected response time: Within 6-12 hours</span>
        </div>
      </div>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link className="rounded-lg bg-[var(--palette-dark-olive)] px-6 py-3 text-sm font-bold text-[var(--palette-white)] transition-colors hover:bg-[var(--palette-moss)]" href="/tickets">View Ticket</Link>
        <Button className="bg-[var(--palette-off-white)] px-6 py-3 text-[var(--palette-dark-olive)] hover:bg-[var(--palette-stone)]" onClick={onSubmitAnother} type="button">Submit Another</Button>
        <Link className="rounded-lg border border-[var(--palette-stone)] px-6 py-3 text-sm font-bold text-[var(--palette-dark-olive)] transition-colors hover:border-[var(--palette-dark-olive)] hover:text-[var(--palette-dark-olive)]" href="/">Return Home</Link>
      </div>
    </div>
  );
}
