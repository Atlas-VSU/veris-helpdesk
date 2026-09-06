/*
    [clientId]/ — Defines a dynamic route for viewing the profile and ticket history of a specific client.
    
    page.tsx under [clientId]/ — Renders the selected client's information and related ticket history.
*/

export default function ClientDetailsPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Client details</h1>
      <p className="mt-4 text-muted-foreground">
        Review the client profile and support history.
      </p>
    </main>
  );
}
