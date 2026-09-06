// [ticketNumber]/ — Defines a dynamic route for displaying the details of a specific ticket based on its ticket number.

export default async function TicketDetailsPage({
  params,
}: PageProps<"/tickets/[ticketNumber]">) {
  const { ticketNumber } = await params;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Ticket {ticketNumber}</h1>
      <p className="mt-4 text-muted-foreground">
        Review the current status and details of your support request.
      </p>
    </main>
  );
}
