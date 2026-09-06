/*
    tickets/ — Contains admin-facing routes for viewing, filtering, searching, assigning, and managing support tickets.
    
    page.tsx under tickets/ — Renders the main admin ticket list or ticket management table.
*/

export default function AdminTicketsPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Support tickets</h1>
      <p className="mt-4 text-muted-foreground">
        View, filter, assign, and manage support tickets.
      </p>
    </main>
  );
}

