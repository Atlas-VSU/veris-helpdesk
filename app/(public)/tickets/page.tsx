 // tickets/ — Contains the client-facing ticket tracking routes for viewing a list of verified tickets and opening individual ticket details.

export default function TicketsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold">Your tickets</h1>
      <p className="mt-4 text-muted-foreground">
        View and track your verified support requests.
      </p>
    </main>
  );
}
