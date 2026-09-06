/*
    [ticketNumber]/ — Defines a dynamic admin route for opening and managing one specific ticket using its ticket number.
    
    page.tsx under [ticketNumber]/ — Renders the complete admin workspace for a selected ticket, including details, messages, status, priority, and assignment controls.    
*/

export default async function AdminTicketDetailsPage({
  params,
}: PageProps<"/admin/tickets/[ticketNumber]">) {
  const { ticketNumber } = await params;

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Ticket {ticketNumber}</h1>
      <p className="mt-4 text-muted-foreground">
        Manage this ticket&apos;s status, priority, assignment, and messages.
      </p>
    </main>
  );
}

