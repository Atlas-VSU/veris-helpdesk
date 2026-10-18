import Link from "next/link";
import { ArrowLeft, LockKeyhole, SearchX, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

function TicketStateShell({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12 sm:px-6 sm:py-16">
      <section className="w-full rounded-3xl border border-border bg-card p-6 text-center text-card-foreground sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-muted text-primary">
          {icon}
        </span>
        <h1 className="mt-5 font-serif text-3xl font-semibold text-[var(--palette-dark-olive)]">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">{description}</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{children}</div>
      </section>
    </main>
  );
}

export function TicketDetailLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading ticket details"
      className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <p role="status" className="sr-only">
        Loading ticket details…
      </p>
      <div className="motion-safe:animate-pulse">
        <div className="h-11 w-40 rounded-lg bg-muted" />
        <div className="mt-5 rounded-3xl border border-border bg-card p-5 sm:p-8">
          <div className="h-4 w-36 rounded bg-muted" />
          <div className="mt-4 h-10 w-3/4 rounded bg-muted" />
          <div className="mt-7 h-5 w-1/2 rounded bg-muted" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)]">
          <div className="h-72 rounded-3xl border border-border bg-card" />
          <div className="h-72 rounded-3xl border border-border bg-card" />
        </div>
        <div className="mt-6 h-64 rounded-3xl border border-border bg-card" />
      </div>
    </main>
  );
}

export function TicketVerificationRequired() {
  return (
    <TicketStateShell
      icon={<LockKeyhole aria-hidden="true" className="size-6" />}
      title="Verify your email to continue"
      description="Your verification session is missing or has expired. Request a new code to securely access your tickets."
    >
      <Button
        nativeButton={false}
        render={<Link href="/verify" />}
        className="min-h-11 rounded-full px-6"
      >
        Verify email
      </Button>
      <Button
        nativeButton={false}
        render={<Link href="/" />}
        variant="outline"
        className="min-h-11 rounded-full px-6"
      >
        Return home
      </Button>
    </TicketStateShell>
  );
}

export function TicketUnavailable() {
  return (
    <TicketStateShell
      icon={<SearchX aria-hidden="true" className="size-6" />}
      title="Ticket unavailable"
      description="We couldn't find this ticket for the verified email. Check the ticket link or verify a different email address."
    >
      <Button
        nativeButton={false}
        render={<Link href="/tickets" />}
        className="min-h-11 rounded-full px-6"
      >
        <ArrowLeft aria-hidden="true" />
        Back to all tickets
      </Button>
      <Button
        nativeButton={false}
        render={<Link href="/verify" />}
        variant="outline"
        className="min-h-11 rounded-full px-6"
      >
        Verify another email
      </Button>
    </TicketStateShell>
  );
}

type TicketLoadErrorProps = {
  reason: "network" | "server";
  onRetry: () => void;
};

export function TicketLoadError({ reason, onRetry }: TicketLoadErrorProps) {
  const description =
    reason === "network"
      ? "Check your connection, then try loading the ticket again."
      : "The ticket service is temporarily unavailable. Please try again in a moment.";

  return (
    <TicketStateShell
      icon={<TriangleAlert aria-hidden="true" className="size-6" />}
      title="We couldn't load this ticket"
      description={description}
    >
      <Button type="button" onClick={onRetry} className="min-h-11 rounded-full px-6">
        Try again
      </Button>
      <Button
        nativeButton={false}
        render={<Link href="/tickets" />}
        variant="outline"
        className="min-h-11 rounded-full px-6"
      >
        Back to all tickets
      </Button>
    </TicketStateShell>
  );
}
