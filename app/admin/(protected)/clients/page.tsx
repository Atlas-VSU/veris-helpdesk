/*
    clients/ — Contains routes for viewing clients and their associated support history.
    
    page.tsx under clients/ — Renders the client directory or list of requesters known to the helpdesk
*/

export default function ClientsPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Clients</h1>
      <p className="mt-4 text-muted-foreground">
        Browse helpdesk clients and their support history.
      </p>
    </main>
  );
}
