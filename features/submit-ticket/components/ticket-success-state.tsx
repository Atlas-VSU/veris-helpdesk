import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TicketSuccessStateProps } from "@/features/submit-ticket/types/types";

export function TicketSuccessState({ email, description, ticketNumber, onSubmitAnother }: TicketSuccessStateProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl border border-[var(--palette-stone)] bg-[var(--palette-warm-white)] p-6 text-center shadow-soft md:p-16">
      <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-[var(--palette-off-white)] text-[var(--palette-dark-olive)] shadow-soft">
        <CheckCircle2 aria-hidden="true" className="size-12" />
      </div>
      <h1 className="font-serif text-3xl font-semibold text-[var(--palette-dark-olive)] md:text-4xl">Success! Your ticket has been submitted.</h1>
      <p className="mt-3 text-lg leading-7 text-[var(--palette-dark-olive)]">Your ticket number is <span className="font-bold text-[var(--palette-dark-olive)]">{ticketNumber}</span>. A confirmation email has been sent to <span className="font-bold text-[var(--palette-dark-olive)]">{email}</span>.</p>

      <div className="mt-10 w-full rounded-xl border border-[var(--palette-stone)]/50 bg-[var(--palette-cream)] p-6 text-left">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--palette-dark-olive)]">Issue Summary</h2>
        <p className="mt-3 text-base leading-6 text-[var(--palette-charcoal-olive)]">{description}</p>
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