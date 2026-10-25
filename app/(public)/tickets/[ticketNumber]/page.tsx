import { ClientTicketPage } from "@/features/client-ticket/components/client-ticket-page";

export default async function TicketDetailsPage({
  params,
}: PageProps<"/tickets/[ticketNumber]">) {
  const { ticketNumber } = await params;

  return <ClientTicketPage key={ticketNumber} ticketNumber={ticketNumber} />;
}
