"use client";

import { TicketDetailView } from "@/features/client-ticket/components/ticket-detail-view";
import {
  TicketDetailLoading,
  TicketLoadError,
  TicketUnavailable,
  TicketVerificationRequired,
} from "@/features/client-ticket/components/ticket-detail-states";
import { useClientTicketDetail } from "@/features/client-ticket/hooks/use-client-ticket-detail";

type ClientTicketPageProps = {
  ticketNumber: string;
};

export function ClientTicketPage({ ticketNumber }: ClientTicketPageProps) {
  const { state, retry } = useClientTicketDetail(ticketNumber);

  if (state.kind === "loading") return <TicketDetailLoading />;
  if (state.kind === "unauthorized") return <TicketVerificationRequired />;
  if (state.kind === "unavailable") return <TicketUnavailable />;
  if (state.kind === "error") return <TicketLoadError reason={state.reason} onRetry={retry} />;

  return <TicketDetailView ticket={state.ticket} />;
}
